import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/slug'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeInactive = searchParams.get('all') === 'true'
  const publicOnly = searchParams.get('public') === 'true'
  const supabase = createSupabaseAdminClient()

  let query = supabase.from('events').select('*').order('event_date', { ascending: true })

  if (publicOnly) {
    query = query
      .eq('is_published', true)
      .is('cancelled_at', null)
      .gte('event_date', new Date().toISOString())
  } else if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data: events, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withCounts = await Promise.all(
    (events ?? []).map(async (e) => {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', e.id)
        .in('status', ['confirmed', 'pending'])
      return { ...e, registration_count: count ?? 0 }
    })
  )

  return NextResponse.json({ events: withCounts })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  let slug = body.slug || generateSlug(body.title)

  const { count } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
  if ((count ?? 0) > 0) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const cancellationDeadline = body.cancellation_deadline
    || (body.min_capacity && body.event_date
      ? new Date(new Date(body.event_date).getTime() - 48 * 60 * 60 * 1000).toISOString()
      : null)

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
      is_published: body.is_published ?? false,
      slug,
      image_url: body.image_url ?? null,
      custom_fields: body.custom_fields ?? [],
      registration_opens_at: body.registration_opens_at ?? null,
      registration_closes_at: body.registration_closes_at ?? null,
      min_capacity: body.min_capacity ?? null,
      cancellation_deadline: cancellationDeadline,
      cancellation_reason: body.cancellation_reason ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data }, { status: 201 })
}
