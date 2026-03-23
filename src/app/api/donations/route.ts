import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { z } from 'zod'

const donationSchema = z.object({
  amount_cents: z.number().min(100, 'Minimum donation is $1'),
  fund: z.enum(['COUNSELING', 'OPERATIONS', 'EVENTS', 'GENERAL']).default('GENERAL'),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional(),
  message: z.string().optional(),
  is_anonymous: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supabase = createSupabaseAdminClient()

  let query = supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })

  const fund = searchParams.get('fund')
  if (fund && fund !== 'ALL') query = query.eq('fund', fund)

  const from = searchParams.get('from')
  if (from) query = query.gte('created_at', from)

  const to = searchParams.get('to')
  if (to) query = query.lte('created_at', to)

  const limit = parseInt(searchParams.get('limit') ?? '200')
  query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute summary
  const allDonations = data ?? []
  const summary = {
    total_cents: allDonations.reduce((s, d) => s + d.amount_cents, 0),
    count: allDonations.length,
    by_fund: {} as Record<string, { total_cents: number; count: number }>,
  }
  for (const d of allDonations) {
    const f = d.fund ?? 'GENERAL'
    if (!summary.by_fund[f]) summary.by_fund[f] = { total_cents: 0, count: 0 }
    summary.by_fund[f].total_cents += d.amount_cents
    summary.by_fund[f].count++
  }

  return NextResponse.json({ donations: allDonations, summary })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = donationSchema.parse(body)
    const supabase = createSupabaseAdminClient()

    // If Stripe is configured and amount > 0, create payment intent
    let stripePaymentIntentId: string | null = null
    if (data.amount_cents > 0 && process.env.STRIPE_SECRET_KEY) {
      try {
        const { getStripe } = await import('@/lib/stripe')
        const stripe = getStripe()
        const intent = await stripe.paymentIntents.create({
          amount: data.amount_cents,
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          metadata: {
            fund: data.fund,
            donorName: data.donor_name ?? '',
            donorEmail: data.donor_email ?? '',
          },
          description: `Donation to NHLB — ${data.fund}`,
          receipt_email: data.donor_email ?? undefined,
        })
        stripePaymentIntentId = intent.id
      } catch {
        // Continue without Stripe in dev
      }
    }

    const { data: donation, error } = await supabase
      .from('donations')
      .insert({
        amount_cents: data.amount_cents,
        fund: data.fund,
        donor_name: data.donor_name ?? null,
        donor_email: data.donor_email ?? null,
        message: data.message ?? null,
        is_anonymous: data.is_anonymous,
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_status: stripePaymentIntentId ? 'pending' : 'dev_mode',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ donation }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors.map(e => e.message).join(', ') }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
