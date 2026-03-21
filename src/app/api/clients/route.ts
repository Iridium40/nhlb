import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const search = searchParams.get('search')
  const supabase = createSupabaseAdminClient()

  // Email lookup mode (returning client flow)
  if (email) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (data && data.length > 0) {
      const clientId = data[0].id
      const { data: lastBooking } = await supabase
        .from('bookings')
        .select('counselor_id, counselor:counselors(id, name, title, zoom_link)')
        .eq('client_id', clientId)
        .eq('status', 'COMPLETED')
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .single()

      return NextResponse.json({
        clients: data,
        lastCounselor: lastBooking?.counselor ?? null,
      })
    }

    return NextResponse.json({ clients: data })
  }

  // Search mode — search across clients, HIPAA data, and session notes
  if (search) {
    const term = search.trim()

    // Direct client field matches
    const { data: directMatches } = await supabase
      .from('clients')
      .select('*')
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    const matchedIds = new Set((directMatches ?? []).map(c => c.id))

    // HIPAA form_data search (JSONB text cast search)
    const { data: hipaaMatches } = await supabase
      .rpc('search_hipaa_intakes', { search_term: `%${term}%` })

    if (hipaaMatches) {
      for (const row of hipaaMatches) {
        matchedIds.add(row.client_id)
      }
    }

    // Session notes content search
    const { data: noteMatches } = await supabase
      .rpc('search_session_notes', { search_term: `%${term}%` })

    if (noteMatches) {
      for (const row of noteMatches) {
        matchedIds.add(row.client_id)
      }
    }

    // Fetch full client records for any IDs found via HIPAA/notes that weren't in direct matches
    const extraIds = [...matchedIds].filter(id => !(directMatches ?? []).some(c => c.id === id))
    let allClients = directMatches ?? []

    if (extraIds.length > 0) {
      const { data: extraClients } = await supabase
        .from('clients')
        .select('*')
        .in('id', extraIds)
      if (extraClients) allClients = [...allClients, ...extraClients]
    }

    // Tag each client with where the match was found
    const hipaaClientIds = new Set((hipaaMatches ?? []).map((r: { client_id: string }) => r.client_id))
    const noteClientIds = new Set((noteMatches ?? []).map((r: { client_id: string }) => r.client_id))

    const enriched = allClients.map(c => ({
      ...c,
      _match_hipaa: hipaaClientIds.has(c.id),
      _match_notes: noteClientIds.has(c.id),
    }))

    return NextResponse.json({ clients: enriched })
  }

  // No search — return all clients
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clients: data })
}
