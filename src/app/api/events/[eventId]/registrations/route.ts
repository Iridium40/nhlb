import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ registrations: data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  // Verify event exists and has capacity
  const { data: event } = await supabase
    .from('events')
    .select('id, max_capacity, registration_fee_cents')
    .eq('id', eventId)
    .eq('is_active', true)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found or closed' }, { status: 404 })
  }

  if (event.max_capacity) {
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'REGISTERED')

    if ((count ?? 0) >= event.max_capacity) {
      return NextResponse.json({ error: 'Event is at full capacity' }, { status: 409 })
    }
  }

  const { data: reg, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone ?? null,
      custom_data: body.custom_data ?? {},
      amount_paid_cents: body.amount_paid_cents ?? event.registration_fee_cents,
      stripe_payment_id: body.stripe_payment_id ?? null,
      status: 'REGISTERED',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also record in donations table under EVENTS fund
  if ((body.amount_paid_cents ?? event.registration_fee_cents) > 0) {
    await supabase.from('donations').insert({
      event_id: eventId,
      amount_cents: body.amount_paid_cents ?? event.registration_fee_cents,
      fund: 'EVENTS',
      donor_name: `${body.first_name} ${body.last_name}`,
      donor_email: body.email,
      stripe_payment_intent_id: body.stripe_payment_id ?? null,
      stripe_status: body.stripe_payment_id ? 'succeeded' : 'pending',
      is_anonymous: false,
    })
  }

  return NextResponse.json({ registration: reg }, { status: 201 })
}
