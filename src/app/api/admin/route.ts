import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'
  const supabase = createSupabaseAdminClient()

  const query = supabase
    .from('bookings')
    .select(`
      *,
      client:clients(*),
      counselor:counselors(id, name, title)
    `)
    .order('scheduled_at', { ascending: true })

  if (status !== 'all') {
    query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { bookingId, status, notes, meeting_link, meeting_id, meeting_passcode } = body
  const supabase = createSupabaseAdminClient()

  const updates: Record<string, unknown> = {}
  if (status !== undefined)           updates.status = status
  if (notes !== undefined)            updates.notes = notes
  if (meeting_link !== undefined)     updates.meeting_link = meeting_link
  if (meeting_id !== undefined)       updates.meeting_id = meeting_id
  if (meeting_passcode !== undefined) updates.meeting_passcode = meeting_passcode

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select(`*, client:clients(*), counselor:counselors(id, name, title)`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ booking: data })
}
