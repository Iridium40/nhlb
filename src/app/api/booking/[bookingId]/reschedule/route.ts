import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'
import { sendBookingConfirmation, sendCounselorNotification } from '@/lib/email'
import { ACTIVE_STATUSES } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const { new_scheduled_at } = await req.json()

  if (!new_scheduled_at) {
    return NextResponse.json({ error: 'new_scheduled_at is required' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { data: booking } = await admin
    .from('bookings')
    .select('*, counselor:counselors(*)')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.client_id !== client.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (!ACTIVE_STATUSES.includes(booking.status)) {
    return NextResponse.json({ error: 'Session cannot be rescheduled' }, { status: 400 })
  }

  const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < 24) {
    return NextResponse.json(
      { error: 'Cannot reschedule within 24 hours of your appointment. Please call 985-264-8808.' },
      { status: 400 }
    )
  }

  const { count: slotTaken } = await admin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('counselor_id', booking.counselor_id)
    .eq('scheduled_at', new_scheduled_at)
    .neq('status', 'cancelled')

  if ((slotTaken ?? 0) > 0) {
    return NextResponse.json({ error: 'That time slot is no longer available.' }, { status: 409 })
  }

  await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  const { data: newBooking, error: insertErr } = await admin
    .from('bookings')
    .insert({
      client_id: client.id,
      counselor_id: booking.counselor_id,
      scheduled_at: new_scheduled_at,
      type: booking.type,
      status: 'requested',
      donation_amount_cents: 0,
    })
    .select()
    .single()

  if (insertErr || !newBooking) {
    return NextResponse.json({ error: 'Failed to create new session' }, { status: 500 })
  }

  const counselor = booking.counselor
  if (counselor) {
    await Promise.allSettled([
      sendBookingConfirmation({ booking: newBooking, counselor, client }),
      sendCounselorNotification({ booking: newBooking, counselor, client }),
    ])
  }

  return NextResponse.json({ newBookingId: newBooking.id })
}
