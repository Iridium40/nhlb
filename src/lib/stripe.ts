import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

export async function createLoveOfferingIntent({
  amountCents,
  bookingId,
  clientEmail,
  clientName,
}: {
  amountCents: number
  bookingId: string
  clientEmail: string
  clientName: string
}) {
  return getStripe().paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { bookingId, clientEmail, clientName },
    description: 'Love offering — No Heart Left Behind counseling session',
    receipt_email: clientEmail,
  })
}
