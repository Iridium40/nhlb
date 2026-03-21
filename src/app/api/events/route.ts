import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeInactive = searchParams.get('all') === 'true'
  const supabase = createSupabaseAdminClient()

  let query = supabase.from('events').select('*').order('event_date', { ascending: true })
  if (!includeInactive) query = query.eq('is_active', true)

  const { data: events, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach registration counts
  const ids = (events ?? []).map(e => e.id)
  const withCounts = await Promise.all(
    (events ?? []).map(async (e) => {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', e.id)
        .eq('status', 'REGISTERED')
      return { ...e, registration_count: count ?? 0 }
    })
  )

  return NextResponse.json({ events: withCounts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: body.title,
      description: body.description ?? null,
      event_date: body.event_date,
      end_date: body.end_date ?? null,
      location: body.location ?? null,
      registration_fee_cents: body.registration_fee_cents ?? 0,
      fee_label: body.fee_label ?? 'Registration Fee',
      max_capacity: body.max_capacity ?? null,
      is_active: body.is_active ?? true,
      image_url: body.image_url ?? null,
      custom_fields: body.custom_fields ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data }, { status: 201 })
}
