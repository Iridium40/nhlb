import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'

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

  const { data, error } = await query.limit(5000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['Date', 'Donor Name', 'Donor Email', 'Amount', 'Fund', 'Anonymous', 'Message', 'Stripe Status']
  const rows = (data ?? []).map(d => [
    format(new Date(d.created_at), 'MM/dd/yyyy'),
    d.is_anonymous ? 'Anonymous' : (d.donor_name ?? ''),
    d.is_anonymous ? '' : (d.donor_email ?? ''),
    `$${(d.amount_cents / 100).toFixed(2)}`,
    d.fund ?? 'GENERAL',
    d.is_anonymous ? 'Yes' : 'No',
    d.message ?? '',
    d.stripe_status ?? '',
  ])

  // Summary row
  const total = (data ?? []).reduce((s, d) => s + d.amount_cents, 0)
  rows.push(['', '', '', `$${(total / 100).toFixed(2)}`, 'TOTAL', '', '', ''])

  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const dateStr = format(new Date(), 'yyyy-MM-dd')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="NHLB_donations_${dateStr}.csv"`,
    },
  })
}
