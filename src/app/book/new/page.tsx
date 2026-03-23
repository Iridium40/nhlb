'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { TimeSlot } from '@/types'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type Step = 'info' | 'schedule' | 'payment' | 'checkout'

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
  btn: {
    width: '100%', backgroundColor: 'var(--nhlb-red)', color: 'white',
    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
    letterSpacing: '0.05em', padding: '14px 24px', borderRadius: 8,
    border: 'none', cursor: 'pointer',
  } as React.CSSProperties,
}

export default function NewClientBookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('info')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: client info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [serviceType, setServiceType] = useState('individual')
  const [reason, setReason] = useState('')

  // Step 2: schedule
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedCounselorId, setSelectedCounselorId] = useState<string | null>(null)

  // Step 3: payment
  const [donationAmount, setDonationAmount] = useState('50')

  // Step 4: Stripe checkout
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true)
    const res = await fetch('/api/booking/availability?newClient=true')
    const json = await res.json()
    setSlots(json.slots ?? [])
    setLoadingSlots(false)
  }, [])

  useEffect(() => {
    if (step === 'schedule') loadSlots()
  }, [step, loadSlots])

  const goToSchedule = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email, and phone number.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setStep('schedule')
  }

  const selectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('payment')
  }

  const handleBooking = async () => {
    if (!selectedSlot) return
    setSubmitting(true)
    setError(null)

    const amountCents = Math.round((parseFloat(donationAmount) || 0) * 100)

    try {
      // 1. Create the booking
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          service_type: serviceType,
          brief_reason: reason || undefined,
          counselor_id: selectedSlot.counselorId,
          scheduled_at: selectedSlot.start,
          type: 'IN_PERSON',
          donation_amount_cents: amountCents,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Could not create session')
        setSubmitting(false)
        return
      }

      setBookingId(json.bookingId)

      // 2. Create account (best-effort)
      try {
        await fetch('/api/auth/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, clientId: json.clientId }),
        })
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signInWithPassword({ email, password })
      } catch {
        // Account creation is best-effort
      }

      // 3. If Stripe is configured and amount >= $10, create PaymentIntent and show checkout
      if (amountCents >= 1000 && stripePromise) {
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountCents,
            clientEmail: email,
            clientName: `${firstName} ${lastName}`,
            bookingId: json.bookingId,
          }),
        })
        const piJson = await piRes.json()
        if (piJson.clientSecret) {
          setClientSecret(piJson.clientSecret)
          setStep('checkout')
          setSubmitting(false)
          return
        }
      }

      // 4. No payment needed or Stripe not configured — go straight to confirmation
      router.push(`/book/confirmation/${json.bookingId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // Group all counselors' slots — show counselor names + photos so clients can choose
  type CounselorInfo = { id: string; name: string; photoUrl: string | null }
  const counselorMap = new Map<string, CounselorInfo>()
  for (const slot of slots) {
    if (!counselorMap.has(slot.counselorId)) {
      counselorMap.set(slot.counselorId, {
        id: slot.counselorId,
        name: slot.counselorName,
        photoUrl: slot.counselorPhotoUrl ?? null,
      })
    }
  }
  const counselors = Array.from(counselorMap.values())

  const filteredSlots = selectedCounselorId
    ? slots.filter(s => s.counselorId === selectedCounselorId)
    : slots

  const groupedSlots = filteredSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const key = format(new Date(slot.start), 'EEE, MMM d')
    if (!acc[key]) acc[key] = []
    if (!acc[key].some(s => s.start === slot.start)) acc[key].push(slot)
    return acc
  }, {})

  const stepLabels = ['Your Info', 'Choose a Time', 'Love Offering', ...(stripePromise ? ['Payment'] : [])]
  const stepIndex = step === 'info' ? 0 : step === 'schedule' ? 1 : step === 'payment' ? 2 : 3

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        New Client &mdash; In-Person Session
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <a href="/book" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; Back</a>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 0 20px',
        }}>Book Your First Session</h1>
      </header>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 40 }}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: i < 2 ? 1 : 'none' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Lato, sans-serif',
                backgroundColor: i < stepIndex ? '#2D7A4F' : i === stepIndex ? 'var(--nhlb-red)' : 'var(--nhlb-blush-light)',
                color: i <= stepIndex ? 'white' : 'var(--nhlb-muted)',
              }}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', whiteSpace: 'nowrap',
                color: i === stepIndex ? 'var(--nhlb-red-dark)' : 'var(--nhlb-muted)',
                fontWeight: i === stepIndex ? 700 : 400,
              }}>{label}</span>
              {i < 2 && <div style={{ flex: 1, height: 1, backgroundColor: 'var(--nhlb-border)', marginLeft: 4 }} />}
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            marginBottom: 24, padding: '14px 16px',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: '#B91C1C',
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Info */}
        {step === 'info' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Tell us about yourself
            </h2>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', marginBottom: 28 }}>
              All information is kept private and confidential.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={S.label}>First name *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} style={S.input} className="input-brand" placeholder="Jane" /></div>
              <div><label style={S.label}>Last name *</label><input value={lastName} onChange={e => setLastName(e.target.value)} style={S.input} className="input-brand" placeholder="Smith" /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>Email *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} className="input-brand" placeholder="jane@example.com" /></div>
            <div style={{ marginBottom: 16 }}><label style={S.label}>Phone *</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={S.input} className="input-brand" placeholder="(985) 555-0100" /></div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Create a password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...S.input, paddingRight: 40 }} className="input-brand"
                  placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--nhlb-muted)',
                }} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPw ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Confirm password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPw ? 'text' : 'password'} value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  style={{ ...S.input, paddingRight: 40 }} className="input-brand"
                  placeholder="Re-enter password" />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--nhlb-muted)',
                }} aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showConfirmPw ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Type of counseling</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {([
                  { v: 'individual', emoji: '🙏', label: 'Individual' },
                  { v: 'marriage', emoji: '💑', label: 'Marriage' },
                  { v: 'family', emoji: '👨‍👩‍👧', label: 'Family' },
                ] as const).map(({ v, emoji, label }) => (
                  <button key={v} onClick={() => setServiceType(v)} style={{
                    padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${serviceType === v ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                    backgroundColor: serviceType === v ? 'var(--nhlb-red)' : 'white',
                    color: serviceType === v ? 'white' : 'var(--nhlb-text)',
                    borderRadius: 10, transition: 'all 0.12s',
                  }}>
                    <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: 4 }}>{emoji}</span>
                    <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={S.label}>Reason for seeking counseling <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.7 }}>(optional)</span></label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                style={{ ...S.input, resize: 'none' }} className="input-brand"
                placeholder="Feel free to share as little or as much as you'd like..." />
            </div>

            <button onClick={goToSchedule} style={S.btn} className="btn-primary">Continue &rarr;</button>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 'schedule' && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Choose your counselor &amp; time
            </h2>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              In-person &middot; 60 minutes &middot; 430 N. Jefferson Ave, Covington
            </p>

            {loadingSlots ? (
              <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
                Loading available times...
              </p>
            ) : counselors.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
                No available slots right now. Please check back later.
              </p>
            ) : (
              <>
                {/* Counselor picker */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                  <button
                    onClick={() => setSelectedCounselorId(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 16px', borderRadius: 20,
                      border: `2px solid ${!selectedCounselorId ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                      backgroundColor: !selectedCounselorId ? 'var(--nhlb-red)' : 'white',
                      color: !selectedCounselorId ? 'white' : 'var(--nhlb-text)',
                      fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}
                  >
                    All Counselors
                  </button>
                  {counselors.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCounselorId(c.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 14px 6px 6px', borderRadius: 20,
                        border: `2px solid ${selectedCounselorId === c.id ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                        backgroundColor: selectedCounselorId === c.id ? 'var(--nhlb-red)' : 'white',
                        color: selectedCounselorId === c.id ? 'white' : 'var(--nhlb-text)',
                        fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                        backgroundColor: '#F3F4F6', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: selectedCounselorId === c.id ? '2px solid rgba(255,255,255,0.4)' : '1px solid var(--nhlb-border)',
                      }}>
                        {c.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={c.photoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedCounselorId === c.id ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </div>
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Time slots */}
                {Object.keys(groupedSlots).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
                    No available times for this counselor.
                  </p>
                ) : (
                  <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 4, marginBottom: 28 }}>
                    {Object.entries(groupedSlots).map(([day, daySlots]) => (
                      <div key={day} style={{ marginBottom: 24 }}>
                        <p style={{
                          fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'var(--nhlb-muted)', marginBottom: 10,
                        }}>{day}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {daySlots.map(slot => (
                            <button key={`${slot.counselorId}_${slot.start}`} onClick={() => selectSlot(slot)} style={{
                              padding: '10px 4px',
                              border: '1px solid var(--nhlb-border)', borderRadius: 8,
                              backgroundColor: 'white', fontFamily: 'Lato, sans-serif',
                              fontSize: '0.8rem', color: 'var(--nhlb-text)',
                              cursor: 'pointer', transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget).style.backgroundColor = 'var(--nhlb-red)'
                              ;(e.currentTarget).style.color = 'white'
                              ;(e.currentTarget).style.borderColor = 'var(--nhlb-red)'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget).style.backgroundColor = 'white'
                              ;(e.currentTarget).style.color = 'var(--nhlb-text)'
                              ;(e.currentTarget).style.borderColor = 'var(--nhlb-border)'
                            }}>
                              {format(new Date(slot.start), 'h:mm a')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button onClick={() => setStep('info')} style={{
              background: 'none', border: 'none', fontFamily: 'Lato, sans-serif',
              fontSize: '0.875rem', color: 'var(--nhlb-muted)', cursor: 'pointer', padding: 0,
            }}>&larr; Back</button>
          </div>
        )}

        {/* Step 3: Payment / Love Offering */}
        {step === 'payment' && selectedSlot && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Love Offering
            </h2>
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: '20px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                  backgroundColor: '#F3F4F6', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--nhlb-border)',
                }}>
                  {selectedSlot.counselorPhotoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={selectedSlot.counselorPhotoUrl} alt={selectedSlot.counselorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px', textTransform: 'uppercase' }}>
                    Your Counselor
                  </p>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                    {selectedSlot.counselorName}
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--nhlb-border)', marginTop: 14, paddingTop: 14 }}>
                <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', margin: 0 }}>
                  <strong style={{ color: 'var(--nhlb-red-dark)' }}>{format(new Date(selectedSlot.start), 'EEEE, MMMM d')}</strong> at <strong style={{ color: 'var(--nhlb-red-dark)' }}>{format(new Date(selectedSlot.start), 'h:mm a')}</strong> &middot; In-person
                </p>
              </div>
            </div>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 24 }}>
              We ask for a minimum $10 love offering. Give what you have decided in your heart.
            </p>

            <blockquote style={{
              borderLeft: '3px solid var(--nhlb-blush)', paddingLeft: 16, margin: '0 0 28px',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '1.05rem', color: 'var(--nhlb-muted)', lineHeight: 1.6,
            }}>
              &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
              <cite style={{ display: 'block', fontStyle: 'normal', fontSize: '0.85rem', marginTop: 6, color: 'var(--nhlb-blush)' }}>
                &mdash; 2 Corinthians 9:7
              </cite>
            </blockquote>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Select an amount</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
                {['10', '25', '50', '75', '100'].map(amt => (
                  <button key={amt} onClick={() => setDonationAmount(amt)} style={{
                    padding: '10px 4px',
                    border: `1px solid ${donationAmount === amt ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                    borderRadius: 8,
                    backgroundColor: donationAmount === amt ? 'var(--nhlb-red)' : 'white',
                    color: donationAmount === amt ? 'white' : 'var(--nhlb-text)',
                    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer', transition: 'all 0.12s',
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
                <input type="number" min="10" step="1" value={donationAmount}
                  onChange={e => setDonationAmount(e.target.value)}
                  style={{ ...S.input, paddingLeft: 28 }} className="input-brand"
                  placeholder="Minimum $10" />
              </div>
              {parseFloat(donationAmount) < 10 && donationAmount !== '' && (
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#B91C1C', marginTop: 4 }}>
                  Minimum donation is $10
                </p>
              )}
            </div>

            <button
              onClick={handleBooking}
              disabled={submitting || parseFloat(donationAmount) < 10}
              style={{
                ...S.btn,
                opacity: submitting || parseFloat(donationAmount) < 10 ? 0.5 : 1,
                cursor: submitting || parseFloat(donationAmount) < 10 ? 'not-allowed' : 'pointer',
              }}
              className="btn-primary"
            >
              {submitting
                ? 'Confirming...'
                : stripePromise
                  ? `Continue to Payment — $${parseFloat(donationAmount || '10').toFixed(2)}`
                  : `Confirm & Give $${parseFloat(donationAmount || '10').toFixed(2)}`}
            </button>

            <button onClick={() => { setStep('schedule'); setSelectedSlot(null) }} style={{
              display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
              fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)',
              cursor: 'pointer', padding: 0,
            }}>&larr; Choose a different time</button>
          </div>
        )}

        {/* Step 4: Stripe Checkout */}
        {step === 'checkout' && clientSecret && bookingId && selectedSlot && (
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
              Complete Payment
            </h2>
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: '20px', marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>
                Love offering for your session with <strong style={{ color: 'var(--nhlb-red-dark)' }}>{selectedSlot.counselorName}</strong>
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                <strong style={{ color: 'var(--nhlb-red-dark)' }}>{format(new Date(selectedSlot.start), 'EEEE, MMMM d')}</strong> at <strong style={{ color: 'var(--nhlb-red-dark)' }}>{format(new Date(selectedSlot.start), 'h:mm a')}</strong>
              </p>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', marginBottom: 20 }}>
              ${parseFloat(donationAmount).toFixed(2)}
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: 28,
            }}>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <BookingPaymentForm bookingId={bookingId} />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BookingPaymentForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: paymentError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation/${bookingId}`,
      },
      redirect: 'if_required',
    })

    if (paymentError) {
      setError(paymentError.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
    } else {
      router.push(`/book/confirmation/${bookingId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#B91C1C',
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{
          width: '100%', backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
          letterSpacing: '0.05em', padding: '14px 24px', borderRadius: 8,
          border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
          marginTop: 20, opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  )
}
