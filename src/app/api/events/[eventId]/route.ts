import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { generateSlug } from '@/lib/slug'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { count } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'pending'])

  return NextResponse.json({ event: { ...data, registration_count: count ?? 0 } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const fields = [
    'title', 'description', 'event_date', 'end_date', 'location',
    'registration_fee_cents', 'fee_label', 'max_capacity', 'is_active',
    'is_published', 'image_url', 'custom_fields',
    'registration_opens_at', 'registration_closes_at',
    'min_capacity', 'cancellation_deadline', 'cancellation_reason',
    'min_check_sent_at',
  ]
  const updates: Record<string, unknown> = {}
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  if (body.slug !== undefined) {
    updates.slug = body.slug
  } else if (body.title && !body.slug) {
    const { data: current } = await supabase
      .from('events').select('slug, title').eq('id', eventId).single()
    if (!current?.slug || current.title !== body.title) {
      let newSlug = generateSlug(body.title)
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('slug', newSlug)
        .neq('id', eventId)
      if ((count ?? 0) > 0) newSlug = `${newSlug}-${Date.now().toString(36)}`
      updates.slug = newSlug
    }
  }

  if (body.min_capacity && !body.cancellation_deadline) {
    const { data: current } = await supabase
      .from('events').select('cancellation_deadline, event_date').eq('id', eventId).single()
    if (!current?.cancellation_deadline && current?.event_date) {
      updates.cancellation_deadline = new Date(
        new Date(current.event_date).getTime() - 48 * 60 * 60 * 1000
      ).toISOString()
    }
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
