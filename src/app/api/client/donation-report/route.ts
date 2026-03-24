import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, first_name, last_name, email')
    .eq('supabase_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') ?? new Date().getFullYear().toString()

  const startDate = `${year}-01-01T00:00:00.000Z`
  const endDate = `${year}-12-31T23:59:59.999Z`

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, scheduled_at, type, status, donation_amount_cents, counselor:counselors(name)')
    .eq('client_id', client.id)
    .gt('donation_amount_cents', 0)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .in('status', ['confirmed', 'in_session', 'completed'])
    .order('scheduled_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalCents = (bookings ?? []).reduce((sum, b) => sum + (b.donation_amount_cents ?? 0), 0)

  return NextResponse.json({
    client: { first_name: client.first_name, last_name: client.last_name, email: client.email },
    year,
    donations: bookings ?? [],
    totalCents,
  })
}
