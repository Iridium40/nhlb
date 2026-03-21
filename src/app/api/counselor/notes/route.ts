import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

async function getCounselor() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  return counselor
}

export async function GET(req: NextRequest) {
  const counselor = await getCounselor()
  if (!counselor) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('bookingId')
  const clientId = searchParams.get('clientId')
  const admin = createSupabaseAdminClient()

  if (bookingId) {
    const { data } = await admin
      .from('session_notes')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('counselor_id', counselor.id)
      .single()
    return NextResponse.json({ note: data })
  }

  if (clientId) {
    const { data: bookingIds } = await admin
      .from('bookings')
      .select('id')
      .eq('client_id', clientId)
      .eq('counselor_id', counselor.id)

    if (!bookingIds?.length) return NextResponse.json({ notes: [] })

    const { data } = await admin
      .from('session_notes')
      .select('*, booking:bookings(id, scheduled_at, status)')
      .in('booking_id', bookingIds.map(b => b.id))
      .order('created_at', { ascending: false })

    return NextResponse.json({ notes: data ?? [] })
  }

  return NextResponse.json({ error: 'Provide bookingId or clientId' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const counselor = await getCounselor()
  if (!counselor) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const admin = createSupabaseAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('id', body.booking_id)
    .eq('counselor_id', counselor.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const { data: existing } = await admin
    .from('session_notes')
    .select('id')
    .eq('booking_id', body.booking_id)
    .single()

  if (existing) {
    const { data, error } = await admin
      .from('session_notes')
      .update({
        content: body.content ?? '',
        private_notes: body.private_notes ?? '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ note: data })
  }

  const { data, error } = await admin
    .from('session_notes')
    .insert({
      booking_id: body.booking_id,
      counselor_id: counselor.id,
      content: body.content ?? '',
      private_notes: body.private_notes ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data }, { status: 201 })
}
