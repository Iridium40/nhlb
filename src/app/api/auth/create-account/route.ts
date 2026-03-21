import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, password, clientId } = await req.json()
  const supabase = createSupabaseAdminClient()

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Link auth user to client record
  if (clientId && authData.user) {
    await supabase
      .from('clients')
      .update({ supabase_user_id: authData.user.id })
      .eq('id', clientId)
  }

  // Create Stripe customer if Stripe is configured
  let stripeCustomerId: string | null = null
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { getStripe } = await import('@/lib/stripe')
      const stripe = getStripe()
      const customer = await stripe.customers.create({
        email,
        metadata: { clientId: clientId ?? '', supabaseUserId: authData.user.id },
      })
      stripeCustomerId = customer.id

      if (clientId) {
        await supabase
          .from('clients')
          .update({ stripe_customer_id: customer.id })
          .eq('id', clientId)
      }
    } catch (err) {
      console.error('[create-account] Stripe customer creation failed:', err)
    }
  }

  return NextResponse.json({
    userId: authData.user.id,
    stripeCustomerId,
  })
}
