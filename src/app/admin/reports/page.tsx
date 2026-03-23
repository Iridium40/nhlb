'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, startOfYear, subDays, startOfMonth, subMonths } from 'date-fns'
import type { Fund } from '@/types'
import { FUND_LABELS, FUND_COLORS } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

interface CounselorStat {
  counselor_id: string
  counselor_name: string
  total_sessions: number
  completed_sessions: number
  cancelled_sessions: number
  total_revenue_cents: number
  avg_donation_cents: number
  donation_count: number
  completion_rate: number
}

interface MonthlyData {
  month: string
  COUNSELING?: number
  OPERATIONS?: number
  EVENTS?: number
  GENERAL?: number
  [key: string]: string | number | undefined
}

interface ReportData {
  counselor_stats: CounselorStat[]
  fund_totals: Record<string, { total_cents: number; count: number }>
  grand_total_cents: number
  total_donations: number
  monthly: MonthlyData[]
}

const QUICK_RANGES = [
  { label: 'This Month', from: () => startOfMonth(new Date()), to: () => null },
  { label: 'Last 3 Months', from: () => subMonths(new Date(), 3), to: () => null },
  { label: 'This Year', from: () => startOfYear(new Date()), to: () => null },
  { label: 'Last Year', from: () => startOfYear(subDays(startOfYear(new Date()), 1)), to: () => subDays(startOfYear(new Date()), 1) },
  { label: 'All Time', from: () => null, to: () => null },
]

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => startOfYear(new Date()).toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState('')
  const [tab, setTab] = useState<'settlement' | 'counselors' | 'trends'>('settlement')
  const [counselorFilter, setCounselorFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', new Date(dateFrom).toISOString())
    if (dateTo) params.set('to', new Date(dateTo + 'T23:59:59').toISOString())

    const res = await fetch(`/api/reports?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  // Derived filtered data when a counselor is selected
  const counselorNames = data?.counselor_stats.map(c => c.counselor_name) ?? []
  const filtered: ReportData | null = data && counselorFilter !== 'all'
    ? (() => {
        const stat = data.counselor_stats.find(c => c.counselor_name === counselorFilter)
        const counselingRevenue = stat?.total_revenue_cents ?? 0
        const counselingCount = stat?.donation_count ?? 0
        return {
          counselor_stats: stat ? [stat] : [],
          fund_totals: {
            ...Object.fromEntries(Object.entries(data.fund_totals).map(([k]) => [k, { total_cents: 0, count: 0 }])),
            COUNSELING: { total_cents: counselingRevenue, count: counselingCount },
          },
          grand_total_cents: counselingRevenue,
          total_donations: counselingCount,
          monthly: data.monthly.map(m => ({ ...m, OPERATIONS: 0, EVENTS: 0, GENERAL: 0 })),
        }
      })()
    : data

  const exportUrl = (type: string) => {
    const params = new URLSearchParams({ type })
    if (dateFrom) params.set('from', new Date(dateFrom).toISOString())
    if (dateTo) params.set('to', new Date(dateTo + 'T23:59:59').toISOString())
    return `/api/reports/export?${params}`
  }

  const S = {
    label: { display: 'block' as const, fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4 },
    dateInput: { border: '1px solid var(--nhlb-border)', borderRadius: 8, padding: '6px 10px', fontSize: '0.8rem', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-text)' },
    card: { background: 'white', border: '1px solid var(--nhlb-border)', borderRadius: 12, padding: '20px 24px' },
    th: { padding: '10px 16px', textAlign: 'left' as const, fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)' },
    td: { padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)' },
  }

  const funds: Fund[] = ['COUNSELING', 'OPERATIONS', 'EVENTS', 'GENERAL']
  const tabs = [
    { key: 'settlement', label: 'Settlement / Books' },
    { key: 'counselors', label: 'Counselor Revenue' },
    { key: 'trends', label: 'Monthly Trends' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
          <a href={exportUrl('settlement')} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
            backgroundColor: 'white', color: 'var(--nhlb-text)',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
            textDecoration: 'none',
          }}>
            Export Settlement CSV
          </a>
          <a href={exportUrl('counselor')} style={{
            padding: '8px 14px', borderRadius: 8,
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
            textDecoration: 'none',
          }}>
            Export Counselor CSV
          </a>
        </div>

        {/* Date filters */}
        <div style={{
          ...S.card, marginBottom: 20,
          display: 'flex', alignItems: 'end', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <label style={S.label}>FROM</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={S.dateInput} />
          </div>
          <div>
            <label style={S.label}>TO</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={S.dateInput} />
          </div>
          {counselorNames.length > 0 && (
            <div>
              <label style={S.label}>COUNSELOR</label>
              <select
                value={counselorFilter}
                onChange={e => setCounselorFilter(e.target.value)}
                style={{
                  ...S.dateInput,
                  cursor: 'pointer',
                  minWidth: 160,
                  borderColor: counselorFilter !== 'all' ? 'var(--nhlb-red)' : undefined,
                  color: counselorFilter !== 'all' ? 'var(--nhlb-red-dark)' : undefined,
                  fontWeight: counselorFilter !== 'all' ? 700 : 400,
                }}>
                <option value="all">All Counselors</option>
                {counselorNames.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {QUICK_RANGES.map(r => (
              <button key={r.label} onClick={() => {
                const f = r.from()
                const t = r.to()
                setDateFrom(f ? format(f, 'yyyy-MM-dd') : '')
                setDateTo(t ? format(t, 'yyyy-MM-dd') : '')
              }}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                  backgroundColor: 'white', color: 'var(--nhlb-muted)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700,
                  cursor: 'pointer',
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading || !filtered ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading reports...</p>
        ) : (
          <>
            {/* Counselor filter indicator */}
            {counselorFilter !== 'all' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '10px 16px', background: '#FDF2F2', border: '1px solid var(--nhlb-border)',
                borderRadius: 8,
              }}>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-red-dark)', fontWeight: 700 }}>
                  Showing: {counselorFilter}
                </span>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)' }}>
                  (counseling revenue only)
                </span>
                <button onClick={() => setCounselorFilter('all')} style={{
                  marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                  backgroundColor: 'white', color: 'var(--nhlb-muted)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                }}>Clear filter</button>
              </div>
            )}

            {/* Grand totals row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div style={{ ...S.card, textAlign: 'center', borderLeft: '4px solid var(--nhlb-red)' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                  {dollars(filtered.grand_total_cents)}
                </p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
                  {counselorFilter !== 'all' ? 'COUNSELING REVENUE' : 'TOTAL REVENUE'} ({filtered.total_donations} transactions)
                </p>
              </div>
              {funds.map(f => {
                const fd = filtered.fund_totals[f]
                return (
                  <div key={f} style={{ ...S.card, textAlign: 'center', borderLeft: `4px solid ${FUND_COLORS[f].text}` }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: FUND_COLORS[f].text, margin: 0 }}>
                      {dollars(fd?.total_cents ?? 0)}
                    </p>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
                      {FUND_LABELS[f].toUpperCase()} ({fd?.count ?? 0})
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: '1px solid',
                    borderColor: tab === t.key ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                    backgroundColor: tab === t.key ? 'var(--nhlb-red)' : 'white',
                    color: tab === t.key ? 'white' : 'var(--nhlb-muted)',
                    fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Settlement / Books */}
            {tab === 'settlement' && (
              <div>
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-red-dark)', margin: '0 0 16px' }}>
                    Revenue by Fund
                  </h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--nhlb-cream-dark)' }}>
                        {['Fund', 'Revenue', 'Transactions', '% of Total'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {funds.map((f, i) => {
                        const fd = filtered.fund_totals[f]
                        const pct = filtered.grand_total_cents > 0 ? ((fd?.total_cents ?? 0) / filtered.grand_total_cents * 100) : 0
                        return (
                          <tr key={f} style={{ borderTop: i > 0 ? '1px solid var(--nhlb-border)' : 'none' }}>
                            <td style={S.td}>
                              <span style={{
                                backgroundColor: FUND_COLORS[f].bg, color: FUND_COLORS[f].text,
                                padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                                fontFamily: 'Lato, sans-serif',
                              }}>
                                {FUND_LABELS[f]}
                              </span>
                            </td>
                            <td style={{ ...S.td, fontWeight: 700 }}>{dollars(fd?.total_cents ?? 0)}</td>
                            <td style={S.td}>{fd?.count ?? 0}</td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 80, height: 8, backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: FUND_COLORS[f].text, borderRadius: 4 }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      <tr style={{ borderTop: '2px solid var(--nhlb-red-dark)' }}>
                        <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>Total</td>
                        <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>{dollars(filtered.grand_total_cents)}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>{filtered.total_donations}</td>
                        <td style={S.td} />
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ ...S.card }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-red-dark)', margin: '0 0 12px' }}>
                    Settlement Notes
                  </h2>
                  <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', lineHeight: 1.7 }}>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>Counseling Services:</strong> Love offerings collected during counseling sessions. Attributable to individual counselors.
                    </p>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>Ministry Operations:</strong> General operating fund donations received via the donate page.
                    </p>
                    <p style={{ margin: '0 0 8px' }}>
                      <strong>Events:</strong> Registration fees collected for ministry events.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>General Fund:</strong> Undesignated donations and other giving.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Counselor Revenue */}
            {tab === 'counselors' && (
              <div style={{ ...S.card }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-red-dark)', margin: '0 0 16px' }}>
                  Revenue by Counselor
                </h2>
                {filtered.counselor_stats.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 32, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--nhlb-muted)' }}>
                    No session data for this period
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--nhlb-cream-dark)' }}>
                          {['Counselor', 'Sessions', 'Completed', 'Cancelled', 'Rate', 'Total Revenue', 'Avg Offering', '# Donations'].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.counselor_stats.map((c, i) => (
                          <tr key={c.counselor_id} style={{ borderTop: i > 0 ? '1px solid var(--nhlb-border)' : 'none' }}>
                            <td style={{ ...S.td, fontWeight: 700 }}>{c.counselor_name}</td>
                            <td style={S.td}>{c.total_sessions}</td>
                            <td style={S.td}>
                              <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>
                                {c.completed_sessions}
                              </span>
                            </td>
                            <td style={S.td}>
                              {c.cancelled_sessions > 0 ? (
                                <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, fontFamily: 'Lato, sans-serif' }}>
                                  {c.cancelled_sessions}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--nhlb-muted)', fontSize: '0.8rem' }}>0</span>
                              )}
                            </td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 50, height: 6, backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${c.completion_rate}%`, height: '100%', borderRadius: 3,
                                    backgroundColor: c.completion_rate >= 80 ? '#065F46' : c.completion_rate >= 50 ? '#D97706' : '#DC2626',
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>{c.completion_rate}%</span>
                              </div>
                            </td>
                            <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>
                              {dollars(c.total_revenue_cents)}
                            </td>
                            <td style={{ ...S.td, fontWeight: 700 }}>
                              {dollars(c.avg_donation_cents)}
                            </td>
                            <td style={S.td}>{c.donation_count}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid var(--nhlb-red-dark)' }}>
                          <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>Totals</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{filtered.counselor_stats.reduce((s, c) => s + c.total_sessions, 0)}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{filtered.counselor_stats.reduce((s, c) => s + c.completed_sessions, 0)}</td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{filtered.counselor_stats.reduce((s, c) => s + c.cancelled_sessions, 0)}</td>
                          <td style={S.td} />
                          <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>
                            {dollars(filtered.counselor_stats.reduce((s, c) => s + c.total_revenue_cents, 0))}
                          </td>
                          <td style={{ ...S.td, fontWeight: 700 }}>
                            {(() => {
                              const allDonations = filtered.counselor_stats.reduce((s, c) => s + c.donation_count, 0)
                              const allRevenue = filtered.counselor_stats.reduce((s, c) => s + c.total_revenue_cents, 0)
                              return allDonations > 0 ? dollars(Math.round(allRevenue / allDonations)) : '$0.00'
                            })()}
                          </td>
                          <td style={{ ...S.td, fontWeight: 700 }}>{filtered.counselor_stats.reduce((s, c) => s + c.donation_count, 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Trends */}
            {tab === 'trends' && (
              <div style={{ ...S.card }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-red-dark)', margin: '0 0 16px' }}>
                  Monthly Revenue Trends
                </h2>
                {filtered.monthly.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 32, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--nhlb-muted)' }}>
                    No data for this period
                  </p>
                ) : (
                  <>
                    {/* Bar chart */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        {funds.map(f => (
                          <span key={f} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)',
                          }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: FUND_COLORS[f].text, display: 'inline-block' }} />
                            {FUND_LABELS[f]}
                          </span>
                        ))}
                      </div>

                      {(() => {
                        const maxMonth = Math.max(...filtered.monthly.map(m =>
                          funds.reduce((s, f) => s + (Number(m[f] ?? 0)), 0)
                        ))
                        return (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 200, padding: '0 0 24px' }}>
                            {filtered.monthly.map(m => {
                              const total = funds.reduce((s, f) => s + Number(m[f] ?? 0), 0)
                              return (
                                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                                  <div style={{ width: '100%', maxWidth: 50, display: 'flex', flexDirection: 'column-reverse', height: maxMonth > 0 ? Math.max((total / maxMonth) * 180, 4) : 4 }}>
                                    {funds.map(f => {
                                      const val = Number(m[f] ?? 0)
                                      if (val === 0) return null
                                      const pct = total > 0 ? (val / total) * 100 : 0
                                      return (
                                        <div key={f} style={{
                                          height: `${pct}%`, backgroundColor: FUND_COLORS[f].text,
                                          minHeight: val > 0 ? 2 : 0,
                                        }}
                                          title={`${FUND_LABELS[f]}: ${dollars(val)}`}
                                        />
                                      )
                                    })}
                                  </div>
                                  <p style={{
                                    fontFamily: 'Lato, sans-serif', fontSize: '0.55rem', color: 'var(--nhlb-muted)',
                                    margin: '6px 0 0', textAlign: 'center', writingMode: 'horizontal-tb',
                                  }}>
                                    {format(new Date(m.month + '-01'), 'MMM')}
                                  </p>
                                  <p style={{
                                    fontFamily: 'Lato, sans-serif', fontSize: '0.55rem', fontWeight: 700,
                                    color: 'var(--nhlb-text)', margin: '2px 0 0', textAlign: 'center',
                                  }}>
                                    {total > 0 ? dollars(total) : ''}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>

                    {/* Monthly table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--nhlb-cream-dark)' }}>
                            <th style={S.th}>Month</th>
                            {funds.map(f => <th key={f} style={S.th}>{FUND_LABELS[f]}</th>)}
                            <th style={S.th}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.monthly.map((m, i) => {
                            const total = funds.reduce((s, f) => s + Number(m[f] ?? 0), 0)
                            return (
                              <tr key={m.month} style={{ borderTop: i > 0 ? '1px solid var(--nhlb-border)' : 'none' }}>
                                <td style={{ ...S.td, fontWeight: 700 }}>{format(new Date(m.month + '-01'), 'MMMM yyyy')}</td>
                                {funds.map(f => (
                                  <td key={f} style={S.td}>{dollars(Number(m[f] ?? 0))}</td>
                                ))}
                                <td style={{ ...S.td, fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>{dollars(total)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
