import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const supabase = createSupabaseAdminClient()

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // ── 1. Fetch all bookings with counselor info ──
  let bookingsQ = supabase
    .from('bookings')
    .select('id, counselor_id, scheduled_at, status, donation_amount_cents, counselor:counselors(id, name)')

  if (from) bookingsQ = bookingsQ.gte('scheduled_at', from)
  if (to) bookingsQ = bookingsQ.lte('scheduled_at', to)

  const { data: bookings, error: bErr } = await bookingsQ
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  // ── 2. Fetch all donations in range ──
  let donationsQ = supabase
    .from('donations')
    .select('id, booking_id, amount_cents, fund, created_at')

  if (from) donationsQ = donationsQ.gte('created_at', from)
  if (to) donationsQ = donationsQ.lte('created_at', to)

  const { data: donations, error: dErr } = await donationsQ
  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 })

  // ── 3. Build counselor-level stats ──
  const counselorMap: Record<string, {
    counselor_id: string
    counselor_name: string
    total_sessions: number
    completed_sessions: number
    cancelled_sessions: number
    total_revenue_cents: number
    session_donations: number[]
  }> = {}

  const allBookings = bookings ?? []
  for (const b of allBookings) {
    const cid = b.counselor_id
    const counselor = b.counselor as unknown as { id: string; name: string } | null
    if (!counselorMap[cid]) {
      counselorMap[cid] = {
        counselor_id: cid,
        counselor_name: counselor?.name ?? 'Unknown',
        total_sessions: 0,
        completed_sessions: 0,
        cancelled_sessions: 0,
        total_revenue_cents: 0,
        session_donations: [],
      }
    }
    const entry = counselorMap[cid]
    entry.total_sessions++
    if (b.status === 'completed') entry.completed_sessions++
    if (b.status === 'cancelled') entry.cancelled_sessions++
  }

  // Map booking_id → counselor_id for donation attribution
  const bookingCounselorMap: Record<string, string> = {}
  for (const b of allBookings) {
    bookingCounselorMap[b.id] = b.counselor_id
  }

  // Attribute COUNSELING donations to counselors via booking_id
  const allDonations = donations ?? []
  for (const d of allDonations) {
    if (d.fund === 'COUNSELING' && d.booking_id && bookingCounselorMap[d.booking_id]) {
      const cid = bookingCounselorMap[d.booking_id]
      if (counselorMap[cid]) {
        counselorMap[cid].total_revenue_cents += d.amount_cents
        counselorMap[cid].session_donations.push(d.amount_cents)
      }
    }
  }

  const counselorStats = Object.values(counselorMap).map(c => ({
    counselor_id: c.counselor_id,
    counselor_name: c.counselor_name,
    total_sessions: c.total_sessions,
    completed_sessions: c.completed_sessions,
    cancelled_sessions: c.cancelled_sessions,
    total_revenue_cents: c.total_revenue_cents,
    avg_donation_cents: c.session_donations.length > 0
      ? Math.round(c.session_donations.reduce((a, b) => a + b, 0) / c.session_donations.length)
      : 0,
    donation_count: c.session_donations.length,
    completion_rate: c.total_sessions > 0
      ? Math.round((c.completed_sessions / c.total_sessions) * 100)
      : 0,
  })).sort((a, b) => b.total_revenue_cents - a.total_revenue_cents)

  // ── 4. Fund-level settlement summary ──
  const fundTotals: Record<string, { total_cents: number; count: number }> = {}
  for (const d of allDonations) {
    const f = d.fund ?? 'GENERAL'
    if (!fundTotals[f]) fundTotals[f] = { total_cents: 0, count: 0 }
    fundTotals[f].total_cents += d.amount_cents
    fundTotals[f].count++
  }

  const grandTotal = allDonations.reduce((s, d) => s + d.amount_cents, 0)

  // ── 5. Monthly trend (last 12 months) ──
  const monthlyMap: Record<string, Record<string, number>> = {}
  for (const d of allDonations) {
    const month = d.created_at.slice(0, 7) // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = {}
    const f = d.fund ?? 'GENERAL'
    monthlyMap[month][f] = (monthlyMap[month][f] ?? 0) + d.amount_cents
  }
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, funds]) => ({ month, ...funds }))

  return NextResponse.json({
    counselor_stats: counselorStats,
    fund_totals: fundTotals,
    grand_total_cents: grandTotal,
    total_donations: allDonations.length,
    monthly,
  })
}
