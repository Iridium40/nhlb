import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendVirtualSessionInfo } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json()
  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, client:clients(*), counselor:counselors(*)')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.session_format !== 'virtual') {
    return NextResponse.json({ error: 'Not a virtual booking' }, { status: 400 })
  }

  if (!booking.meeting_link) {
    return NextResponse.json({ error: 'No meeting link saved yet' }, { status: 400 })
  }

  try {
    await sendVirtualSessionInfo({
      booking,
      counselor: booking.counselor,
      client: booking.client,
    })
    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[admin/notify]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
