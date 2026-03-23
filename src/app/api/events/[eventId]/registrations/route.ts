import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendEventConfirmationEmail } from '@/lib/email'
import type { Event, EventRegistration } from '@/types'

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

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single() as { data: Event | null }

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }
  if (!event.is_published && !event.is_active) {
    return NextResponse.json({ error: 'Event is not active' }, { status: 400 })
  }
  if (event.cancelled_at) {
    return NextResponse.json({ error: 'Event has been cancelled' }, { status: 400 })
  }

  const now = new Date()
  if (event.registration_opens_at && new Date(event.registration_opens_at) > now) {
    return NextResponse.json({ error: 'Registration has not opened yet' }, { status: 400 })
  }
  if (event.registration_closes_at && new Date(event.registration_closes_at) < now) {
    return NextResponse.json({ error: 'Registration is closed' }, { status: 400 })
  }

  if (event.max_capacity) {
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'pending'])

    if ((count ?? 0) >= event.max_capacity) {
      return NextResponse.json({ error: 'Event is at full capacity' }, { status: 409 })
    }
  }

  const isPaid = event.registration_fee_cents > 0

  if (isPaid) {
    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()

    const { data: reg, error: regErr } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone ?? null,
        custom_data: body.custom_data ?? {},
        amount_paid_cents: event.registration_fee_cents,
        status: 'pending',
      })
      .select()
      .single()

    if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: event.registration_fee_cents,
      currency: 'usd',
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        registrationId: reg.id,
        type: 'event_registration',
      },
    })

    await supabase
      .from('event_registrations')
      .update({ stripe_payment_id: paymentIntent.id })
      .eq('id', reg.id)

    return NextResponse.json({
      registrationId: reg.id,
      clientSecret: paymentIntent.client_secret,
      requiresPayment: true,
    }, { status: 201 })
  }

  // Free event — confirm immediately
  const { data: reg, error: regErr } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone ?? null,
      custom_data: body.custom_data ?? {},
      amount_paid_cents: 0,
      status: 'confirmed',
    })
    .select()
    .single()

  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 })

  try {
    await sendEventConfirmationEmail({
      event,
      registration: reg as unknown as EventRegistration,
    })
  } catch (emailErr) {
    console.error('[registration] Confirmation email failed:', emailErr)
  }

  return NextResponse.json({
    registrationId: reg.id,
    confirmed: true,
    requiresPayment: false,
  }, { status: 201 })
}
