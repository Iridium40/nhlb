'use client'

import { useState } from 'react'
import type { Fund } from '@/types'
import { FUND_LABELS } from '@/types'
import Link from 'next/link'

const FUNDS: { key: Fund; icon: string; desc: string }[] = [
  { key: 'GENERAL', icon: '❤️', desc: 'Support NHLB wherever the need is greatest' },
  { key: 'COUNSELING', icon: '🙏', desc: 'Fund affordable counseling sessions' },
  { key: 'OPERATIONS', icon: '🏠', desc: 'Building, utilities, and ministry operations' },
  { key: 'EVENTS', icon: '🎉', desc: 'Community events and outreach programs' },
]

const S = {
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 6,
  } as React.CSSProperties,
}

export default function DonatePage() {
  const [fund, setFund] = useState<Fund>('GENERAL')
  const [amount, setAmount] = useState('25')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDonate = async () => {
    const cents = Math.round(parseFloat(amount || '0') * 100)
    if (cents < 100) { setError('Minimum donation is $1.'); return }
    if (!isAnonymous && !email.trim()) { setError('Please enter your email or donate anonymously.'); return }
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: cents,
        fund,
        donor_name: isAnonymous ? null : name || null,
        donor_email: isAnonymous ? null : email || null,
        message: message || null,
        is_anonymous: isAnonymous,
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Donation failed')
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
          textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
          padding: '8px 16px', fontFamily: 'Lato, sans-serif',
        }}>Thank You!</div>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EAF5EE',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2D7A4F" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px' }}>
              Thank you for your generosity!
            </h1>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 8 }}>
              Your ${parseFloat(amount).toFixed(2)} donation to <strong>{FUND_LABELS[fund]}</strong> makes a difference.
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1rem', color: 'var(--nhlb-muted)', marginTop: 32 }}>
              &ldquo;God loves a cheerful giver.&rdquo; &mdash; 2 Corinthians 9:7
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/events" style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
                color: 'var(--nhlb-muted)', textDecoration: 'none', backgroundColor: 'white',
              }}>View Events</Link>
              <Link href="/book" style={{
                padding: '10px 20px', borderRadius: 8,
                backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
              }}>Book a Session</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Let&apos;s Build Hope &amp; Healing TOGETHER!
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 80,
      }}>
        <a href="https://www.noheartleftbehind.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w" alt="NHLB" style={{ height: 56, width: 'auto' }} />
        </a>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/book" style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--nhlb-muted)', textDecoration: 'none' }}>Book a Session</Link>
          <Link href="/events" style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--nhlb-muted)', textDecoration: 'none' }}>Events</Link>
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 600, width: '100%', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
        }}>
          Give to the Ministry
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', lineHeight: 1.7, marginBottom: 32 }}>
          Your generous donation helps provide affordable, faith-based counseling and community support.
        </p>

        {/* Fund selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>Direct your gift</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FUNDS.map(f => (
              <button key={f.key} onClick={() => setFund(f.key)} style={{
                padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${fund === f.key ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                backgroundColor: fund === f.key ? 'var(--nhlb-red)' : 'white',
                color: fund === f.key ? 'white' : 'var(--nhlb-text)',
                borderRadius: 10, transition: 'all 0.12s',
              }}>
                <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>{' '}
                <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem' }}>
                  {FUND_LABELS[f.key]}
                </span>
                <span style={{
                  display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
                  opacity: 0.8, marginTop: 2,
                }}>{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>Amount</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
            {['10', '25', '50', '100', '250'].map(amt => (
              <button key={amt} onClick={() => setAmount(amt)} style={{
                padding: '10px 4px',
                border: `1px solid ${amount === amt ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                borderRadius: 8,
                backgroundColor: amount === amt ? 'var(--nhlb-red)' : 'white',
                color: amount === amt ? 'white' : 'var(--nhlb-text)',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              }}>
                ${amt}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)',
            }}>$</span>
            <input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ ...S.input, paddingLeft: 28 }} className="input-brand" />
          </div>
        </div>

        {/* Donor info */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
          <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }} />
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem' }}>Give anonymously</span>
        </label>

        {!isAnonymous && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={S.label}>Your name</label><input value={name} onChange={e => setName(e.target.value)} style={S.input} className="input-brand" /></div>
            <div><label style={S.label}>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} className="input-brand" /></div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>Message <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.7 }}>(optional)</span></label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
            style={{ ...S.input, resize: 'none' }} className="input-brand"
            placeholder="Leave a note of encouragement..." />
        </div>

        {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
          <div style={{
            marginBottom: 20, padding: '14px 16px',
            backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#92400E',
          }}>
            Payment integration pending &mdash; donation will be recorded without payment processing.
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: 16, padding: '12px 14px',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
          }}>{error}</div>
        )}

        <button onClick={handleDonate} disabled={submitting} style={{
          width: '100%', padding: '16px 24px', borderRadius: 8, border: 'none',
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '1rem',
          cursor: 'pointer', opacity: submitting ? 0.6 : 1,
        }} className="btn-primary">
          {submitting ? 'Processing...' : `Give $${parseFloat(amount || '0').toFixed(2)} to ${FUND_LABELS[fund]}`}
        </button>

        <blockquote style={{
          borderLeft: '3px solid var(--nhlb-blush)', paddingLeft: 16, margin: '32px 0 0',
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: '1.05rem', color: 'var(--nhlb-muted)', lineHeight: 1.6,
        }}>
          &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
          <cite style={{ display: 'block', fontStyle: 'normal', fontSize: '0.85rem', marginTop: 6, color: 'var(--nhlb-blush)' }}>
            &mdash; 2 Corinthians 9:7
          </cite>
        </blockquote>
      </main>

      <footer style={{ backgroundColor: 'var(--nhlb-blush)', padding: '24px 48px', color: 'white' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', margin: 0 }}>
          No Heart Left Behind &copy; {new Date().getFullYear()} &ensp;&middot;&ensp; 985-264-8808
        </p>
      </footer>
    </div>
  )
}
