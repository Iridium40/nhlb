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

  const { data: clients, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clientIds = (clients ?? []).map(c => c.id)
  let bookingCounts: Record<string, number> = {}
  let lastSessionDates: Record<string, string> = {}

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

  const enriched = (clients ?? []).map(c => ({
    ...c,
    session_count: bookingCounts[c.id] ?? 0,
    last_session_at: lastSessionDates[c.id] ?? null,
  }))

  return NextResponse.json({ clients: enriched })
}
