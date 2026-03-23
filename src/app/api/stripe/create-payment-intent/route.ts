import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  amountCents: z.number().min(1000, 'Minimum donation is $10'),
  clientEmail: z.string().email(),
  clientName: z.string(),
  bookingId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  paymentMethodId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        clientSecret: null,
        devMode: true,
        message: 'Payment integration pending — booking will proceed without payment.',
      })
    }

    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()

    const intentParams: Record<string, unknown> = {
      amount: data.amountCents,
      currency: 'usd',
      metadata: {
        bookingId: data.bookingId ?? '',
        clientEmail: data.clientEmail,
        clientName: data.clientName,
      },
      description: 'Love offering — No Heart Left Behind counseling session',
      receipt_email: data.clientEmail,
    }

    if (data.stripeCustomerId) {
      intentParams.customer = data.stripeCustomerId
    }

    if (data.paymentMethodId) {
      intentParams.payment_method = data.paymentMethodId
      intentParams.confirm = true
      intentParams.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never',
      }
    } else {
      intentParams.automatic_payment_methods = { enabled: true }
    }

    const intent = await stripe.paymentIntents.create(intentParams as Parameters<typeof stripe.paymentIntents.create>[0])

    if (data.paymentMethodId && intent.status === 'succeeded') {
      return NextResponse.json({
        paymentIntentId: intent.id,
        confirmed: true,
      })
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error('[/api/stripe/create-payment-intent]', err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
