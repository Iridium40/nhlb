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
    .select('*, client:clients(first_name, last_name, email, phone, service_type)')
    .eq('counselor_id', counselor.id)
    .gte('scheduled_at', rangeStart.toISOString())
    .lte('scheduled_at', rangeEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: bookings ?? [], counselorId: counselor.id })
}
