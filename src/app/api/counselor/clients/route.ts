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

  const admin = createSupabaseAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()

  const noteMatchClientIds = new Set<string>()

  if (search) {
    // Search session notes scoped to this counselor's sessions
    const { data: noteHits } = await admin
      .from('session_notes')
      .select('booking:bookings!inner(client_id)')
      .eq('counselor_id', counselor.id)
      .or(`content.ilike.%${search}%,private_notes.ilike.%${search}%`)

    for (const row of noteHits ?? []) {
      const clientId = (row.booking as unknown as { client_id: string })?.client_id
      if (clientId) noteMatchClientIds.add(clientId)
    }
  }

  let query = admin
    .from('clients')
    .select('*')
    .eq('assigned_counselor_id', counselor.id)
    .order('last_name', { ascending: true })

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data: directClients, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let allClients = directClients ?? []
  const directIds = new Set(allClients.map(c => c.id))

  // Add any clients found via notes search that weren't in the direct results
  if (search && noteMatchClientIds.size > 0) {
    const extraIds = [...noteMatchClientIds].filter(id => !directIds.has(id))
    if (extraIds.length > 0) {
      const { data: extraClients } = await admin
        .from('clients')
        .select('*')
        .eq('assigned_counselor_id', counselor.id)
        .in('id', extraIds)
      if (extraClients) allClients = [...allClients, ...extraClients]
    }
  }

  const clientIds = allClients.map(c => c.id)
  const bookingCounts: Record<string, number> = {}
  const lastSessionDates: Record<string, string> = {}

  if (clientIds.length > 0) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('client_id, scheduled_at, status')
      .eq('counselor_id', counselor.id)
      .in('client_id', clientIds)
      .neq('status', 'CANCELLED')
      .order('scheduled_at', { ascending: false })

    for (const b of bookings ?? []) {
      bookingCounts[b.client_id] = (bookingCounts[b.client_id] ?? 0) + 1
      if (!lastSessionDates[b.client_id]) {
        lastSessionDates[b.client_id] = b.scheduled_at
      }
    }
  }

  const enriched = allClients.map(c => ({
    ...c,
    session_count: bookingCounts[c.id] ?? 0,
    last_session_at: lastSessionDates[c.id] ?? null,
    _match_notes: noteMatchClientIds.has(c.id),
  }))

  return NextResponse.json({ clients: enriched })
}
