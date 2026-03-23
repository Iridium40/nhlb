import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendEventConfirmationEmail } from '@/lib/email'
import type { Event, EventRegistration } from '@/types'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const { getStripe } = await import('@/lib/stripe')
  const stripe = getStripe()

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const bookingId = intent.metadata?.bookingId
    const registrationId = intent.metadata?.registrationId
    const isEventReg = intent.metadata?.type === 'event_registration'

    if (bookingId) {
      await supabase
        .from('bookings')
        .update({
          stripe_payment_id: intent.id,
          status: 'confirmed',
        })
        .eq('id', bookingId)
    }

    if (isEventReg && registrationId) {
      await supabase
        .from('event_registrations')
        .update({
          status: 'confirmed',
          stripe_payment_id: intent.id,
        })
        .eq('id', registrationId)

      const eventId = intent.metadata?.eventId
      if (eventId) {
        await supabase.from('donations').insert({
          event_id: eventId,
          amount_cents: intent.amount,
          fund: 'EVENTS',
          stripe_payment_intent_id: intent.id,
          stripe_status: 'succeeded',
          is_anonymous: false,
        })

        try {
          const { data: eventData } = await supabase
            .from('events').select('*').eq('id', eventId).single()
          const { data: regData } = await supabase
            .from('event_registrations').select('*').eq('id', registrationId).single()
          if (eventData && regData) {
            await sendEventConfirmationEmail({
              event: eventData as unknown as Event,
              registration: regData as unknown as EventRegistration,
            })
          }
        } catch (emailErr) {
          console.error('[webhook] Event confirmation email failed:', emailErr)
        }
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    console.error('[webhook] Payment failed:', intent.id)
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id

    if (paymentIntentId) {
      const { data: registration } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('stripe_payment_id', paymentIntentId)
        .single()

      if (registration) {
        await supabase
          .from('event_registrations')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            refund_amount_cents: charge.amount_refunded,
          })
          .eq('id', registration.id)
      }
    }
  }

  return NextResponse.json({ received: true })
}
