import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLoveOfferingIntent } from '@/lib/stripe'
import { createSupabaseAdminClient } from '@/lib/supabase'

const schema = z.object({
  bookingId: z.string().uuid(),
  clientId: z.string().uuid(),
  amountDollars: z.number().min(0).max(10000),
  message: z.string().optional(),
  isAnonymous: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookingId, clientId, amountDollars, message, isAnonymous } = schema.parse(body)

    const amountCents = Math.round(amountDollars * 100)
    const supabase = createSupabaseAdminClient()

    const { data: client } = await supabase
      .from('clients')
      .select('email, first_name, last_name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (amountCents === 0) {
      await supabase.from('donations').insert({
        booking_id: bookingId,
        client_id: clientId,
        amount_cents: 0,
        stripe_status: 'skipped',
        message: message ?? null,
        is_anonymous: isAnonymous,
      })
      return NextResponse.json({ skip: true })
    }

    const intent = await createLoveOfferingIntent({
      amountCents,
      bookingId,
      clientEmail: client.email,
      clientName: `${client.first_name} ${client.last_name}`,
    })

    await supabase.from('donations').insert({
      booking_id: bookingId,
      client_id: clientId,
      amount_cents: amountCents,
      stripe_payment_intent_id: intent.id,
      stripe_status: 'pending',
      message: message ?? null,
      is_anonymous: isAnonymous,
    })

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error('[/api/payment]', err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
