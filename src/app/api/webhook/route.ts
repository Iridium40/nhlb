import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createSupabaseAdminClient } from '@/lib/supabase'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('donations')
        .update({ stripe_status: 'succeeded' })
        .eq('stripe_payment_intent_id', intent.id)

      const { data: donation } = await supabase
        .from('donations')
        .select('booking_id')
        .eq('stripe_payment_intent_id', intent.id)
        .single()

      if (donation?.booking_id) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', donation.booking_id)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('donations')
        .update({ stripe_status: 'failed' })
        .eq('stripe_payment_intent_id', intent.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
