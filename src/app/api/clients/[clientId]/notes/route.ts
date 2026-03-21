import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = createSupabaseAdminClient()

  const { data: bookingIds } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', clientId)

  if (!bookingIds?.length) return NextResponse.json({ notes: [] })

  const ids = bookingIds.map(b => b.id)
  const { data, error } = await supabase
    .from('session_notes')
    .select('*, booking:bookings(id, scheduled_at, counselor:counselors(id, name))')
    .in('booking_id', ids)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  // Verify booking belongs to this client
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, client_id')
    .eq('id', body.booking_id)
    .eq('client_id', clientId)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found for this client' }, { status: 404 })
  }

  // Upsert — one note per booking
  const { data: existing } = await supabase
    .from('session_notes')
    .select('id')
    .eq('booking_id', body.booking_id)
    .single()

  if (existing) {
    const { data, error } = await supabase
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

  const { data, error } = await supabase
    .from('session_notes')
    .insert({
      booking_id: body.booking_id,
      counselor_id: body.counselor_id,
      content: body.content ?? '',
      private_notes: body.private_notes ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data }, { status: 201 })
}
