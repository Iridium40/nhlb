'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, subDays, startOfYear } from 'date-fns'
import type { Donation, Fund } from '@/types'
import { FUND_LABELS, FUND_COLORS } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

const QUICK_RANGES = [
  { label: 'This Year', from: () => startOfYear(new Date()).toISOString() },
  { label: 'Last 30 Days', from: () => subDays(new Date(), 30).toISOString() },
  { label: 'Last 90 Days', from: () => subDays(new Date(), 90).toISOString() },
  { label: 'All Time', from: () => '' },
]

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [summary, setSummary] = useState<{
    total_cents: number
    count: number
    by_fund: Record<string, { total_cents: number; count: number }>
  }>({ total_cents: 0, count: 0, by_fund: {} })
  const [loading, setLoading] = useState(true)
  const [fundFilter, setFundFilter] = useState<Fund | 'ALL'>('ALL')
  const [dateFrom, setDateFrom] = useState(() => startOfYear(new Date()).toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (fundFilter !== 'ALL') params.set('fund', fundFilter)
    if (dateFrom) params.set('from', new Date(dateFrom).toISOString())
    if (dateTo) params.set('to', new Date(dateTo + 'T23:59:59').toISOString())

    const res = await fetch(`/api/donations?${params}`)
    const json = await res.json()
    setDonations(json.donations ?? [])
    setSummary(json.summary ?? { total_cents: 0, count: 0, by_fund: {} })
    setLoading(false)
  }, [fundFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const exportUrl = () => {
    const params = new URLSearchParams()
    if (fundFilter !== 'ALL') params.set('fund', fundFilter)
    if (dateFrom) params.set('from', new Date(dateFrom).toISOString())
    if (dateTo) params.set('to', new Date(dateTo + 'T23:59:59').toISOString())
    return `/api/donations/export?${params}`
  }

  const funds: (Fund | 'ALL')[] = ['ALL', 'COUNSELING', 'OPERATIONS', 'EVENTS', 'GENERAL']

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <a href={exportUrl()} style={{
            padding: '8px 18px', borderRadius: 8,
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            textDecoration: 'none',
          }}>
            Export CSV for Taxes
          </a>
        </div>

        {/* Fund summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
              ${(summary.total_cents / 100).toFixed(2)}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
              TOTAL ({summary.count} donations)
            </p>
          </div>
          {(['COUNSELING', 'OPERATIONS', 'EVENTS', 'GENERAL'] as Fund[]).map(f => {
            const data = summary.by_fund[f]
            return (
              <div key={f} style={{
                background: 'white', border: '1px solid var(--nhlb-border)',
                borderRadius: 12, padding: '20px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 600, color: FUND_COLORS[f].text, margin: 0 }}>
                  ${((data?.total_cents ?? 0) / 100).toFixed(2)}
                </p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '4px 0 0' }}>
                  {FUND_LABELS[f].toUpperCase()} ({data?.count ?? 0})
                </p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'end', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <label style={{
              display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4,
            }}>FUND</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {funds.map(f => (
                <button key={f} onClick={() => setFundFilter(f)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: fundFilter === f ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                    backgroundColor: fundFilter === f ? 'var(--nhlb-red)' : 'white',
                    color: fundFilter === f ? 'white' : 'var(--nhlb-muted)',
                    fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  {f === 'ALL' ? 'All' : FUND_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{
              display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4,
            }}>FROM</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{
                border: '1px solid var(--nhlb-border)', borderRadius: 8,
                padding: '6px 10px', fontSize: '0.8rem', fontFamily: 'Lato, sans-serif',
                color: 'var(--nhlb-text)',
              }} />
          </div>
          <div>
            <label style={{
              display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
              fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4,
            }}>TO</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{
                border: '1px solid var(--nhlb-border)', borderRadius: 8,
                padding: '6px 10px', fontSize: '0.8rem', fontFamily: 'Lato, sans-serif',
                color: 'var(--nhlb-text)',
              }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {QUICK_RANGES.map(r => (
              <button key={r.label} onClick={() => { setDateFrom(r.from() ? r.from().slice(0, 10) : ''); setDateTo('') }}
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

        {/* Donation list */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
        ) : donations.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
            No donations found for this period
          </p>
        ) : (
          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--nhlb-cream-dark)' }}>
                  {['Date', 'Donor', 'Amount', 'Fund', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.06em', color: 'var(--nhlb-muted)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map((d, i) => {
                  const fundKey = (d.fund ?? 'GENERAL') as Fund
                  return (
                    <tr key={d.id} style={{ borderTop: i > 0 ? '1px solid var(--nhlb-border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
                        {format(new Date(d.created_at), 'MMM d, yyyy')}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)' }}>
                        {d.is_anonymous ? <em style={{ color: 'var(--nhlb-muted)' }}>Anonymous</em> : d.donor_name || d.donor_email || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--nhlb-text)' }}>
                        ${(d.amount_cents / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          ...FUND_COLORS[fundKey],
                          backgroundColor: FUND_COLORS[fundKey].bg,
                          color: FUND_COLORS[fundKey].text,
                          padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                          fontFamily: 'Lato, sans-serif',
                        }}>
                          {FUND_LABELS[fundKey]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
                        {d.stripe_status === 'succeeded' ? '✓ Paid' : d.stripe_status === 'dev_mode' ? 'Dev' : d.stripe_status ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
