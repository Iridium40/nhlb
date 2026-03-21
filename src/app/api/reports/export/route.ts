import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supabase = createSupabaseAdminClient()
  const type = searchParams.get('type') ?? 'counselor'

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (type === 'counselor') {
    return exportCounselorReport(supabase, from, to)
  }
  if (type === 'settlement') {
    return exportSettlementReport(supabase, from, to)
  }

  return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
}

async function exportCounselorReport(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  from: string | null,
  to: string | null,
) {
  let bq = supabase
    .from('bookings')
    .select('id, counselor_id, scheduled_at, status, donation_amount_cents, counselor:counselors(id, name)')
  if (from) bq = bq.gte('scheduled_at', from)
  if (to) bq = bq.lte('scheduled_at', to)

  let dq = supabase.from('donations').select('id, booking_id, amount_cents, fund')
  if (from) dq = dq.gte('created_at', from)
  if (to) dq = dq.lte('created_at', to)

  const [{ data: bookings }, { data: donations }] = await Promise.all([bq, dq])

  const bookingCounselorMap: Record<string, string> = {}
  const counselorMap: Record<string, {
    name: string; sessions: number; completed: number; cancelled: number
    revenue: number; donationAmounts: number[]
  }> = {}

  for (const b of bookings ?? []) {
    const c = b.counselor as unknown as { id: string; name: string } | null
    const cid = b.counselor_id
    bookingCounselorMap[b.id] = cid
    if (!counselorMap[cid]) counselorMap[cid] = { name: c?.name ?? 'Unknown', sessions: 0, completed: 0, cancelled: 0, revenue: 0, donationAmounts: [] }
    counselorMap[cid].sessions++
    if (b.status === 'COMPLETED') counselorMap[cid].completed++
    if (b.status === 'CANCELLED') counselorMap[cid].cancelled++
  }

  for (const d of donations ?? []) {
    if (d.fund === 'COUNSELING' && d.booking_id && bookingCounselorMap[d.booking_id]) {
      const cid = bookingCounselorMap[d.booking_id]
      if (counselorMap[cid]) {
        counselorMap[cid].revenue += d.amount_cents
        counselorMap[cid].donationAmounts.push(d.amount_cents)
      }
    }
  }

  const headers = ['Counselor', 'Total Sessions', 'Completed', 'Cancelled', 'Completion Rate', 'Total Revenue', 'Avg Love Offering', 'Donations Received']
  const rows = Object.values(counselorMap).map(c => [
    c.name,
    c.sessions.toString(),
    c.completed.toString(),
    c.cancelled.toString(),
    c.sessions > 0 ? `${Math.round((c.completed / c.sessions) * 100)}%` : '0%',
    `$${(c.revenue / 100).toFixed(2)}`,
    c.donationAmounts.length > 0 ? `$${(c.donationAmounts.reduce((a, b) => a + b, 0) / c.donationAmounts.length / 100).toFixed(2)}` : '$0.00',
    c.donationAmounts.length.toString(),
  ])

  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="NHLB_counselor_revenue_${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  })
}

async function exportSettlementReport(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  from: string | null,
  to: string | null,
) {
  let dq = supabase.from('donations').select('*').order('created_at', { ascending: false })
  if (from) dq = dq.gte('created_at', from)
  if (to) dq = dq.lte('created_at', to)

  const { data } = await dq.limit(5000)
  const allDonations = data ?? []

  const fundSummary: Record<string, { total: number; count: number }> = {}
  for (const d of allDonations) {
    const f = d.fund ?? 'GENERAL'
    if (!fundSummary[f]) fundSummary[f] = { total: 0, count: 0 }
    fundSummary[f].total += d.amount_cents
    fundSummary[f].count++
  }

  const headers = ['Fund', 'Total Revenue', 'Transaction Count']
  const rows = Object.entries(fundSummary).map(([fund, s]) => [
    fund,
    `$${(s.total / 100).toFixed(2)}`,
    s.count.toString(),
  ])
  const grandTotal = allDonations.reduce((s, d) => s + d.amount_cents, 0)
  rows.push(['GRAND TOTAL', `$${(grandTotal / 100).toFixed(2)}`, allDonations.length.toString()])

  rows.push([])
  rows.push(['--- Detail ---'])
  const detailHeaders = ['Date', 'Donor', 'Amount', 'Fund', 'Stripe Status']
  rows.push(detailHeaders)
  for (const d of allDonations) {
    rows.push([
      format(new Date(d.created_at), 'MM/dd/yyyy'),
      d.is_anonymous ? 'Anonymous' : (d.donor_name ?? d.donor_email ?? ''),
      `$${(d.amount_cents / 100).toFixed(2)}`,
      d.fund ?? 'GENERAL',
      d.stripe_status ?? '',
    ])
  }

  const csv = rows.map(row =>
    (Array.isArray(row) ? row : [row]).map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="NHLB_settlement_${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  })
}
