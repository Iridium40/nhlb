'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

type Booking = {
  id: string
  scheduled_at: string
  status: string
  type: string
  counselor?: { name: string; title: string } | null
  client?: { first_name: string; last_name: string; email: string } | null
}

export default function CancelBookingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    }>
      <CancelBookingInner />
    </Suspense>
  )
}

function CancelBookingInner() {
  const params = useSearchParams()
  const bookingId = params.get('id') ?? ''
  const prefillEmail = params.get('email') ?? ''

  const [email, setEmail] = useState(prefillEmail)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [step, setStep] = useState<'lookup' | 'confirm' | 'done' | 'error'>('lookup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (bookingId) loadBooking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  async function loadBooking() {
    if (!bookingId) return
    const res = await fetch(`/api/booking/${bookingId}`)
    if (!res.ok) { setError('Booking not found.'); setStep('error'); return }
    const { booking: b } = await res.json()
    if (b.status === 'CANCELLED') { setError('This booking has already been cancelled.'); setStep('error'); return }
    if (b.status === 'COMPLETED') { setError('This booking has already been completed and cannot be cancelled.'); setStep('error'); return }
    setBooking(b)
    if (prefillEmail) setStep('confirm')
  }

  function handleLookup() {
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (!booking) { setError('Booking not found.'); return }
    if (booking.client?.email?.toLowerCase() !== email.trim().toLowerCase()) {
      setError('Email does not match this booking.')
      return
    }
    setError('')
    setStep('confirm')
  }

  async function handleCancel() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED', _caller: 'client', _email: email.trim() }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to cancel booking.')
      setLoading(false)
      return
    }
    setStep('done')
    setLoading(false)
  }

  const S = {
    page: { minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' as const },
    topbar: { backgroundColor: 'var(--nhlb-red-dark)', color: 'white', textAlign: 'center' as const, fontSize: '0.8rem', letterSpacing: '0.05em', padding: '8px 16px', fontFamily: 'Lato, sans-serif' },
    main: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' },
    card: { maxWidth: 520, width: '100%', background: 'white', border: '1px solid var(--nhlb-border)', borderRadius: 12, padding: '32px' },
    h1: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 600 as const, color: 'var(--nhlb-red-dark)', margin: '0 0 8px' },
    label: { display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4 },
    input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--nhlb-border)', fontFamily: 'Lato, sans-serif', fontSize: '0.95rem', boxSizing: 'border-box' as const },
    btn: { width: '100%', padding: '12px', borderRadius: 8, border: 'none', fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
    meta: { fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' },
    val: { fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-text)', margin: 0, fontSize: '0.95rem' },
  }

  return (
    <div style={S.page}>
      <div style={S.topbar}>No Heart Left Behind &mdash; Cancel Booking</div>
      <div style={S.main}>
        <div style={S.card}>

          {step === 'lookup' && (
            <>
              <h1 style={S.h1}>Cancel Your Appointment</h1>
              <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                Please confirm your email address to proceed.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>EMAIL ADDRESS</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={S.input} placeholder="you@example.com"
                  onKeyDown={e => e.key === 'Enter' && handleLookup()} />
              </div>
              {error && <p style={{ color: '#c0392b', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', margin: '0 0 12px' }}>{error}</p>}
              <button onClick={handleLookup} style={{ ...S.btn, background: 'var(--nhlb-red)', color: 'white' }}>
                Continue
              </button>
            </>
          )}

          {step === 'confirm' && booking && (
            <>
              <h1 style={S.h1}>Confirm Cancellation</h1>
              <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                Are you sure you want to cancel this session?
              </p>

              <div style={{ background: '#FDFAF8', borderRadius: 8, padding: 16, marginBottom: 20, border: '1px solid var(--nhlb-border)' }}>
                <div style={S.row}>
                  <div>
                    <p style={S.meta}>DATE</p>
                    <p style={S.val}>{format(new Date(booking.scheduled_at), 'EEEE, MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p style={S.meta}>TIME</p>
                    <p style={S.val}>{format(new Date(booking.scheduled_at), 'h:mm a')}</p>
                  </div>
                </div>
                <div style={S.row}>
                  <div>
                    <p style={S.meta}>COUNSELOR</p>
                    <p style={S.val}>{booking.counselor?.name}</p>
                  </div>
                  <div>
                    <p style={S.meta}>FORMAT</p>
                    <p style={S.val}>{booking.type === 'VIRTUAL' ? 'Virtual' : 'In Person'}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: '#FDF2F2', border: '1px solid #E8AAAA', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <p style={{ color: '#8B2015', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                </div>
              )}

              <button onClick={handleCancel} disabled={loading}
                style={{ ...S.btn, background: '#c0392b', color: 'white', marginBottom: 10, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Cancelling...' : 'Yes, Cancel This Session'}
              </button>
              <button onClick={() => window.history.back()}
                style={{ ...S.btn, background: 'transparent', color: 'var(--nhlb-muted)', border: '1px solid var(--nhlb-border)' }}>
                Go Back
              </button>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EAF5EE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2D7A4F" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 style={S.h1}>Session Cancelled</h1>
              <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                Your appointment has been cancelled. We hope to see you again soon.
              </p>
              <a href="/book" style={{
                display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', borderRadius: 8, textDecoration: 'none',
              }}>
                Book a New Session
              </a>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1rem',
                color: 'var(--nhlb-muted)', marginTop: 40,
              }}>
                &ldquo;As a man thinks in his heart, so is he.&rdquo;<br />
                <span style={{ fontSize: '0.85rem' }}>&mdash; Proverbs 23:7</span>
              </p>
            </div>
          )}

          {step === 'error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FDF2F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#c0392b" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 style={S.h1}>Unable to Cancel</h1>
              <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                {error}
              </p>
              <a href="/book" style={{
                display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', borderRadius: 8, textDecoration: 'none',
              }}>
                Back to Booking
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
