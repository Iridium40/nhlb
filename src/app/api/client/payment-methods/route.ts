import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

async function getClientWithStripe(userId: string) {
  const admin = createSupabaseAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email, first_name, last_name, stripe_customer_id')
    .eq('supabase_user_id', userId)
    .single()
  return { admin, client }
}

async function ensureStripeCustomer(client: { id: string; email: string; first_name: string; last_name: string; stripe_customer_id: string | null }, admin: ReturnType<typeof createSupabaseAdminClient>) {
  if (client.stripe_customer_id) return client.stripe_customer_id

  const { getStripe } = await import('@/lib/stripe')
  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: client.email,
    name: `${client.first_name} ${client.last_name}`,
    metadata: { clientId: client.id },
  })

  await admin
    .from('clients')
    .update({ stripe_customer_id: customer.id })
    .eq('id', client.id)

  return customer.id
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { admin, client } = await getClientWithStripe(user.id)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (!client.stripe_customer_id) {
    return NextResponse.json({ paymentMethods: [] })
  }

  try {
    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()
    const methods = await stripe.paymentMethods.list({
      customer: client.stripe_customer_id,
      type: 'card',
    })

    return NextResponse.json({
      paymentMethods: methods.data.map(m => ({
        id: m.id,
        brand: m.card?.brand ?? 'unknown',
        last4: m.card?.last4 ?? '****',
        expMonth: m.card?.exp_month,
        expYear: m.card?.exp_year,
      })),
    })
  } catch (err) {
    console.error('[payment-methods GET]', err)
    return NextResponse.json({ paymentMethods: [] })
  }
}

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { admin, client } = await getClientWithStripe(user.id)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  try {
    const customerId = await ensureStripeCustomer(client, admin)
    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    console.error('[payment-methods POST]', err)
    return NextResponse.json({ error: 'Could not create setup intent' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client } = await getClientWithStripe(user.id)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { paymentMethodId } = await req.json()
  if (!paymentMethodId) {
    return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
  }

  try {
    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (pm.customer !== client.stripe_customer_id) {
      return NextResponse.json({ error: 'Not your payment method' }, { status: 403 })
    }

    await stripe.paymentMethods.detach(paymentMethodId)
    return NextResponse.json({ detached: true })
  } catch (err) {
    console.error('[payment-methods DELETE]', err)
    return NextResponse.json({ error: 'Could not remove payment method' }, { status: 500 })
  }
}
