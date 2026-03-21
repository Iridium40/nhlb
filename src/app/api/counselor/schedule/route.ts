import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!counselor) return NextResponse.json({ error: 'No counselor profile' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const daysAhead = parseInt(searchParams.get('days') ?? '30')
  const includePast = searchParams.get('past') === 'true'

  const now = new Date()
  const rangeStart = includePast ? startOfDay(addDays(now, -30)) : startOfDay(now)
  const rangeEnd = endOfDay(addDays(now, daysAhead))

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('*, client:clients(id, first_name, last_name, email, phone, service_type), session_note:session_notes(id, content, private_notes, updated_at)')
    .eq('counselor_id', counselor.id)
    .gte('scheduled_at', rangeStart.toISOString())
    .lte('scheduled_at', rangeEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For each upcoming booking, find the most recent previous session note for the same client
  const enriched = (bookings ?? []).map(b => {
    const clientId = b.client?.id
    if (!clientId) return { ...b, previous_note: null }
    const pastNotes = (bookings ?? [])
      .filter(ob =>
        ob.client?.id === clientId &&
        ob.id !== b.id &&
        new Date(ob.scheduled_at) < new Date(b.scheduled_at) &&
        ob.session_note?.content
      )
      .sort((a, z) => new Date(z.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    return {
      ...b,
      previous_note: pastNotes[0]?.session_note ?? null,
      previous_session_date: pastNotes[0]?.scheduled_at ?? null,
    }
  })

  return NextResponse.json({ bookings: enriched, counselorId: counselor.id })
}
