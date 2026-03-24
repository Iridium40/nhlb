'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface Donation {
  id: string
  scheduled_at: string
  type: string
  status: string
  donation_amount_cents: number
  counselor?: { name: string } | null
}

export default function DonationReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [donations, setDonations] = useState<Donation[]>([])
  const [totalCents, setTotalCents] = useState(0)
  const [year, setYear] = useState(new Date().getFullYear())

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/client/donation-report?year=${year}`)
        if (res.status === 401) { router.replace('/book'); return }
        const json = await res.json()
        setClientName(`${json.client.first_name} ${json.client.last_name}`)
        setClientEmail(json.client.email)
        setDonations(json.donations ?? [])
        setTotalCents(json.totalCents ?? 0)
      } catch {
        router.replace('/book')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year, router])

  const handlePrint = () => window.print()

  const handleCSV = () => {
    const header = 'Date,Time,Type,Counselor,Status,Donation Amount'
    const rows = donations.map(d => {
      const date = format(new Date(d.scheduled_at), 'yyyy-MM-dd')
      const time = format(new Date(d.scheduled_at), 'h:mm a')
      const counselor = d.counselor?.name ?? ''
      const amount = (d.donation_amount_cents / 100).toFixed(2)
      return `${date},${time},${d.type === 'VIRTUAL' ? 'Virtual' : 'In Person'},"${counselor}",${d.status},$${amount}`
    })
    rows.push(`,,,,Total,$${(totalCents / 100).toFixed(2)}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NHLB-Donations-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading report...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      {/* Screen-only header */}
      <div className="no-print" style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Donation Report
      </div>

      <header className="no-print" style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <Link href="/book/my-sessions" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; My Sessions</Link>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 0 20px',
        }}>Donation Report</h1>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Year selector + actions (screen only) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-muted)' }}>Year:</label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)',
                backgroundColor: 'white', cursor: 'pointer',
              }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCSV} disabled={donations.length === 0} style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid var(--nhlb-border)',
              backgroundColor: 'white', color: 'var(--nhlb-text)',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              cursor: donations.length === 0 ? 'not-allowed' : 'pointer',
              opacity: donations.length === 0 ? 0.5 : 1,
            }}>
              Download CSV
            </button>
            <button onClick={handlePrint} disabled={donations.length === 0} style={{
              padding: '8px 16px', borderRadius: 6, border: 'none',
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              cursor: donations.length === 0 ? 'not-allowed' : 'pointer',
              opacity: donations.length === 0 ? 0.5 : 1,
            }}>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Printable report area */}
        <div id="donation-report" style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '32px 36px',
        }}>
          {/* Report header */}
          <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid var(--nhlb-red)' }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem',
              fontWeight: 700, color: 'var(--nhlb-red-dark)', margin: '0 0 4px',
            }}>
              No Heart Left Behind
            </h2>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '0 0 2px' }}>
              Counseling Ministry
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: 0 }}>
              Love Offering Donation Summary &mdash; {year}
            </p>
          </div>

          {/* Client info */}
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px', textTransform: 'uppercase' }}>
                Donor
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--nhlb-text)', margin: '0 0 2px' }}>
                {clientName}
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                {clientEmail}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px', textTransform: 'uppercase' }}>
                Report Generated
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', margin: 0 }}>
                {format(new Date(), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {donations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.95rem', color: 'var(--nhlb-muted)' }}>
                No donations recorded for {year}.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--nhlb-border)' }}>
                    {['Date', 'Time', 'Type', 'Counselor', 'Amount'].map(h => (
                      <th key={h} style={{
                        fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: 'var(--nhlb-muted)', padding: '8px 12px',
                        textAlign: h === 'Amount' ? 'right' : 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donations.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--nhlb-border)' }}>
                      <td style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-text)', padding: '10px 12px' }}>
                        {format(new Date(d.scheduled_at), 'MMM d, yyyy')}
                      </td>
                      <td style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', padding: '10px 12px' }}>
                        {format(new Date(d.scheduled_at), 'h:mm a')}
                      </td>
                      <td style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', padding: '10px 12px' }}>
                        {d.type === 'VIRTUAL' ? 'Virtual' : 'In Person'}
                      </td>
                      <td style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', padding: '10px 12px' }}>
                        {d.counselor?.name ?? '—'}
                      </td>
                      <td style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--nhlb-text)', padding: '10px 12px', textAlign: 'right' }}>
                        ${(d.donation_amount_cents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--nhlb-red)' }}>
                    <td colSpan={4} style={{
                      fontFamily: 'Lato, sans-serif', fontSize: '0.9rem', fontWeight: 700,
                      color: 'var(--nhlb-red-dark)', padding: '12px 12px', textAlign: 'right',
                    }}>
                      Total Donations
                    </td>
                    <td style={{
                      fontFamily: 'Lato, sans-serif', fontSize: '1rem', fontWeight: 700,
                      color: 'var(--nhlb-red-dark)', padding: '12px 12px', textAlign: 'right',
                    }}>
                      ${(totalCents / 100).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Disclaimer */}
              <div style={{
                marginTop: 24, padding: '14px 18px',
                backgroundColor: 'var(--nhlb-cream)', borderRadius: 8,
                border: '1px solid var(--nhlb-border)',
              }}>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: 0, lineHeight: 1.6 }}>
                  This report summarizes love offering donations made in connection with counseling sessions at No Heart Left Behind.
                  Please consult your tax advisor regarding the deductibility of these contributions.
                  No goods or services were provided in exchange for these donations.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #donation-report { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
