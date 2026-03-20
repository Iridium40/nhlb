'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { Counselor, BookingFormState, BookingStep } from '@/types'
import { format, addDays, setHours, setMinutes, startOfDay, isSameDay } from 'date-fns'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const step1Schema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  service_type: z.enum(['individual', 'marriage', 'family']),
  session_format: z.enum(['in_person', 'virtual']),
  brief_reason: z.string().max(500).optional(),
})
type Step1Data = z.infer<typeof step1Schema>

const S = {
  input: {
    width: '100%',
    border: '1px solid var(--nhlb-border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.875rem',
    fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)',
    background: 'white',
    outline: 'none',
  } as React.CSSProperties,

  btnPrimary: {
    width: '100%',
    backgroundColor: 'var(--nhlb-red)',
    color: 'white',
    fontFamily: 'Lato, sans-serif',
    fontWeight: 700,
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    padding: '14px 24px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,

  back: {
    background: 'none',
    border: 'none',
    fontFamily: 'Lato, sans-serif',
    fontSize: '0.875rem',
    color: 'var(--nhlb-muted)',
    cursor: 'pointer',
    padding: 0,
  } as React.CSSProperties,

  card: {
    background: 'white',
    border: '1px solid var(--nhlb-border)',
    borderRadius: 12,
    padding: '20px 24px',
  } as React.CSSProperties,

  h2: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '2rem',
    fontWeight: 600,
    color: 'var(--nhlb-red-dark)',
    margin: 0,
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontFamily: 'Lato, sans-serif',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)',
    marginBottom: 6,
  } as React.CSSProperties,
}

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    borderRadius: '8px',
    colorPrimary: '#B8311F',
    colorText: '#3D1A14',
    fontFamily: 'Lato, ui-sans-serif, sans-serif',
  },
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={S.label}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 4, opacity: 0.7 }}>({hint})</span>}
      </label>
      {children}
      {error && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#B8311F', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function ProgressBar({ step }: { step: BookingStep }) {
  const steps = ['Intake', 'Counselor', 'Schedule', 'Love Offering']
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 40 }}>
      {steps.map((label, i) => {
        const num = i + 1
        const done = step > num
        const active = step === num
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: i < 3 ? 1 : 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Lato, sans-serif',
              backgroundColor: done ? '#2D7A4F' : active ? 'var(--nhlb-red)' : 'var(--nhlb-blush-light)',
              color: done || active ? 'white' : 'var(--nhlb-muted)',
              transition: 'background-color 0.2s',
            }}>
              {done ? '✓' : num}
            </div>
            {!isMobile && (
              <span style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', whiteSpace: 'nowrap',
                color: active ? 'var(--nhlb-red-dark)' : 'var(--nhlb-muted)',
                fontWeight: active ? 700 : 400,
              }}>
                {label}
              </span>
            )}
            {i < 3 && (
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--nhlb-border)', marginLeft: 4 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ──
export default function BookingFlow({ counselors }: { counselors: Counselor[] }) {
  const [step, setStep] = useState<BookingStep>(1)
  const [formState, setFormState] = useState<Partial<BookingFormState>>({})
  const [bookingResult, setBookingResult] = useState<{ bookingId: string; clientId: string } | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [complete, setComplete] = useState(false)
  const [donationAmount, setDonationAmount] = useState('25')
  const [donationMessage, setDonationMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [preparingPayment, setPreparingPayment] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formState as Step1Data,
  })

  const onStep1Submit = (data: Step1Data) => {
    setFormState(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  const selectCounselor = async (id: string) => {
    setFormState(prev => ({ ...prev, counselor_id: id }))
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?counselorId=${id}`)
      const json = await res.json()
      setBookedSlots(json.bookedSlots ?? [])
    } catch {
      setBookedSlots([])
    } finally {
      setLoadingSlots(false)
    }
    setStep(3)
  }

  const generateSlots = useCallback((): Date[] => {
    const slots: Date[] = []
    for (let d = 1; d <= 14; d++) {
      const day = addDays(new Date(), d)
      const dow = day.getDay()
      if (dow === 0 || dow === 6) continue
      for (let h = 9; h < 17; h++) slots.push(setMinutes(setHours(startOfDay(day), h), 0))
    }
    return slots
  }, [])

  const isBooked = (date: Date) =>
    bookedSlots.some(s => {
      const b = new Date(s)
      return isSameDay(b, date) && b.getHours() === date.getHours()
    })

  const selectSlot = async (date: Date) => {
    if (isBooked(date)) return
    const scheduled_at = date.toISOString()
    setFormState(prev => ({ ...prev, scheduled_at }))
    setError(null)
    setSubmittingBooking(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formState, scheduled_at }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Could not create booking'); return }
      setBookingResult({ bookingId: json.bookingId, clientId: json.clientId })
      setStep(4)
    } finally {
      setSubmittingBooking(false)
    }
  }

  const handleLoveOffering = async () => {
    if (!bookingResult) return
    setPreparingPayment(true)
    setError(null)
    const amount = parseFloat(donationAmount) || 0
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingResult.bookingId,
          clientId: bookingResult.clientId,
          amountDollars: amount,
          message: donationMessage,
          isAnonymous,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      if (json.skip) { setComplete(true); return }
      setClientSecret(json.clientSecret)
    } finally {
      setPreparingPayment(false)
    }
  }

  // ── Completion screen ──
  if (complete) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '80px 24px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', backgroundColor: '#EAF5EE',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2D7A4F" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 style={{ ...S.h2, fontSize: '2.25rem', marginBottom: 12 }}>You&apos;re all set</h2>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginBottom: 4 }}>
          A confirmation has been sent to
        </p>
        <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>
          {formState.email}
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 16, padding: '8px 20px',
          backgroundColor: formState.session_format === 'virtual' ? '#EFF6FF' : 'var(--nhlb-cream-dark)',
          border: `1px solid ${formState.session_format === 'virtual' ? '#BFDBFE' : 'var(--nhlb-blush-light)'}`,
          borderRadius: 24,
        }}>
          <span style={{ fontSize: '1rem' }}>{formState.session_format === 'virtual' ? '💻' : '🏠'}</span>
          <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--nhlb-text)' }}>
            {formState.session_format === 'virtual' ? 'Virtual session' : 'In-person session'}
          </span>
        </div>

        <div style={{
          ...S.card, marginTop: 24, textAlign: 'left',
          backgroundColor: 'var(--nhlb-cream-dark)',
          border: '1px solid var(--nhlb-blush-light)',
        }}>
          {formState.session_format === 'in_person' ? (
            <>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', marginBottom: 6 }}>
                📍 430 N. Jefferson Ave, Covington, LA 70433
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', marginBottom: 6 }}>
                📞 985-264-8808
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: 0 }}>
                ✉️ reconnectus@yahoo.com
              </p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', marginBottom: 6 }}>
                💻 A secure video link will be emailed to you before your session.
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', marginBottom: 6 }}>
                📞 985-264-8808
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', margin: 0 }}>
                ✉️ reconnectus@yahoo.com
              </p>
            </>
          )}
        </div>

        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: '1.1rem', color: 'var(--nhlb-muted)', marginTop: 40,
        }}>
          &ldquo;As a man thinks in his heart, so is he.&rdquo;<br />
          <span style={{ fontSize: '0.9rem' }}>&mdash; Proverbs 23:7</span>
        </p>
      </div>
    )
  }

  const slots = generateSlots()
  const groupedSlots = slots.reduce<Record<string, Date[]>>((acc, slot) => {
    const key = format(slot, 'EEE, MMM d')
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})
  const selectedCounselor = counselors.find(c => c.id === formState.counselor_id)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

      <ProgressBar step={step} />

      {error && (
        <div style={{
          marginBottom: 24, padding: '14px 16px',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: '#B91C1C',
        }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Intake ── */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1Submit)}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={S.h2}>Tell us about yourself</h2>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginTop: 6, fontSize: '0.875rem' }}>
              All information is kept private and confidential.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Field label="First name" error={errors.first_name?.message}>
              <input {...register('first_name')} style={S.input} placeholder="Jane" className="input-brand" />
            </Field>
            <Field label="Last name" error={errors.last_name?.message}>
              <input {...register('last_name')} style={S.input} placeholder="Smith" className="input-brand" />
            </Field>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Field label="Email address" error={errors.email?.message}>
              <input type="email" {...register('email')} style={S.input} placeholder="jane@example.com" className="input-brand" />
            </Field>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Field label="Phone" hint="optional">
              <input type="tel" {...register('phone')} style={S.input} placeholder="(985) 555-0100" className="input-brand" />
            </Field>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={S.label}>Type of counseling</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {(['individual', 'marriage', 'family'] as const).map(type => {
                const emoji = type === 'individual' ? '🙏' : type === 'marriage' ? '💑' : '👨‍👩‍👧'
                return (
                  <label key={type} style={{ cursor: 'pointer' }}>
                    <input type="radio" value={type} {...register('service_type')} style={{ position: 'absolute', opacity: 0, width: 0 }} />
                    <div className="service-type-option" style={{
                      border: '1px solid var(--nhlb-border)', borderRadius: 10,
                      padding: '12px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                      <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: 4 }}>{emoji}</span>
                      <span style={{
                        fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                        textTransform: 'capitalize', color: 'var(--nhlb-text)',
                      }}>
                        {type}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
            {errors.service_type && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-red)', marginTop: 4 }}>
                {errors.service_type.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={S.label}>Session format</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([
                { value: 'in_person' as const, emoji: '🏠', label: 'In Person', sub: '430 N. Jefferson Ave, Covington' },
                { value: 'virtual' as const, emoji: '💻', label: 'Virtual', sub: 'Secure video call link sent by email' },
              ]).map(({ value, emoji, label, sub }) => (
                <label key={value} style={{ cursor: 'pointer' }}>
                  <input type="radio" value={value} {...register('session_format')} style={{ position: 'absolute', opacity: 0, width: 0 }} />
                  <div className="session-format-option" style={{
                    border: '1px solid var(--nhlb-border)', borderRadius: 10,
                    padding: '14px 12px', cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                    <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: 6 }}>{emoji}</span>
                    <span style={{
                      fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 700,
                      color: 'var(--nhlb-text)', display: 'block', marginBottom: 4,
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
                      color: 'var(--nhlb-muted)', lineHeight: 1.4, display: 'block',
                    }}>
                      {sub}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.session_format && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-red)', marginTop: 4 }}>
                Please choose a session format
              </p>
            )}
          </div>

          <div style={{ marginBottom: 28 }}>
            <Field label="Reason for seeking counseling" hint="optional">
              <textarea
                {...register('brief_reason')}
                rows={3}
                style={{ ...S.input, resize: 'none' }}
                className="input-brand"
                placeholder="Feel free to share as little or as much as you'd like..."
              />
            </Field>
          </div>

          <button type="submit" style={S.btnPrimary} className="btn-primary">
            Continue &rarr;
          </button>
        </form>
      )}

      {/* ── Step 2: Choose counselor ── */}
      {step === 2 && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <h2 style={S.h2}>Choose your counselor</h2>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginTop: 6, fontSize: '0.875rem' }}>
              All our counselors provide affordable, faith-based care.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {counselors.map(c => (
              <button key={c.id} onClick={() => selectCounselor(c.id)}
                style={{
                  ...S.card, width: '100%', textAlign: 'left', cursor: 'pointer',
                  border: '1px solid var(--nhlb-border)', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--nhlb-red)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(184,49,31,0.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--nhlb-border)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600,
                  }}>
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 2px' }}>
                      {c.name}
                    </p>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '0 0 8px' }}>
                      {c.title}
                    </p>
                    {c.bio && (
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)', lineHeight: 1.6, margin: '0 0 10px' }}>
                        {c.bio}
                      </p>
                    )}
                    {c.specialties?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {c.specialties.map(s => (
                          <span key={s} style={{
                            padding: '3px 10px',
                            backgroundColor: 'var(--nhlb-cream-dark)',
                            color: 'var(--nhlb-muted)',
                            borderRadius: 20,
                            fontSize: '0.75rem',
                            fontFamily: 'Lato, sans-serif',
                            textTransform: 'capitalize',
                          }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ color: 'var(--nhlb-blush)', fontSize: '1.25rem', flexShrink: 0 }}>&rarr;</span>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setStep(1)} style={S.back}>&larr; Back</button>
        </div>
      )}

      {/* ── Step 3: Schedule ── */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <h2 style={S.h2}>Choose a time</h2>
            {selectedCounselor && (
              <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginTop: 6, fontSize: '0.875rem' }}>
                Session with {selectedCounselor.name} &middot; 60 minutes
              </p>
            )}
          </div>

          {loadingSlots ? (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
              Loading availability...
            </div>
          ) : (
            <div style={{ maxHeight: '56vh', overflowY: 'auto', paddingRight: 4, marginBottom: 28 }}>
              {Object.entries(groupedSlots).map(([day, times]) => (
                <div key={day} style={{ marginBottom: 20 }}>
                  <p style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--nhlb-muted)', marginBottom: 8,
                  }}>{day}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {times.map(t => {
                      const booked = isBooked(t)
                      return (
                        <button key={t.toISOString()}
                          onClick={() => !booked && selectSlot(t)}
                          disabled={booked || submittingBooking}
                          style={{
                            padding: '10px 4px',
                            border: `1px solid ${booked ? 'var(--nhlb-blush-light)' : 'var(--nhlb-border)'}`,
                            borderRadius: 8,
                            backgroundColor: booked ? 'var(--nhlb-cream-dark)' : 'white',
                            fontFamily: 'Lato, sans-serif',
                            fontSize: '0.8rem',
                            color: booked ? 'var(--nhlb-blush)' : 'var(--nhlb-text)',
                            textDecoration: booked ? 'line-through' : 'none',
                            cursor: booked ? 'not-allowed' : 'pointer',
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => {
                            if (!booked) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--nhlb-red)'
                              ;(e.currentTarget as HTMLElement).style.color = 'white'
                              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--nhlb-red)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!booked) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'white'
                              ;(e.currentTarget as HTMLElement).style.color = 'var(--nhlb-text)'
                              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--nhlb-border)'
                            }
                          }}
                        >
                          {format(t, 'h:mm a')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {submittingBooking && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)', textAlign: 'center', marginBottom: 16 }}>
              Reserving your slot...
            </p>
          )}

          <button onClick={() => setStep(2)} style={S.back}>&larr; Back</button>
        </div>
      )}

      {/* ── Step 4a: Love offering ── */}
      {step === 4 && !clientSecret && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={S.h2}>Love offering</h2>
            <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginTop: 6, fontSize: '0.875rem', lineHeight: 1.7 }}>
              Give what you have decided in your heart. There is no wrong amount &mdash; our doors are open to everyone.
            </p>
          </div>

          <blockquote style={{
            borderLeft: '3px solid var(--nhlb-blush)',
            paddingLeft: 16,
            margin: '0 0 28px',
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: 'var(--nhlb-muted)',
            lineHeight: 1.6,
          }}>
            &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
            <cite style={{ display: 'block', fontStyle: 'normal', fontSize: '0.875rem', marginTop: 6, color: 'var(--nhlb-blush)' }}>
              &mdash; 2 Corinthians 9:7
            </cite>
          </blockquote>

          <div style={{ marginBottom: 20 }}>
            <p style={S.label}>Select an amount</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
              {['0', '15', '25', '50', '75'].map(amt => (
                <button key={amt} onClick={() => setDonationAmount(amt)}
                  style={{
                    padding: '10px 4px',
                    border: `1px solid ${donationAmount === amt ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                    borderRadius: 8,
                    backgroundColor: donationAmount === amt ? 'var(--nhlb-red)' : 'white',
                    color: donationAmount === amt ? 'white' : 'var(--nhlb-text)',
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}>
                  {amt === '0' ? 'Skip' : `$${amt}`}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-muted)',
              }}>$</span>
              <input
                type="number" min="0" step="1" value={donationAmount}
                onChange={e => setDonationAmount(e.target.value)}
                style={{ ...S.input, paddingLeft: 28 }}
                className="input-brand"
                placeholder="Enter a custom amount"
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Field label="Leave a note" hint="optional">
              <input
                value={donationMessage}
                onChange={e => setDonationMessage(e.target.value)}
                style={S.input}
                className="input-brand"
                placeholder="A prayer, encouragement, or kind word..."
              />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 28 }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)', cursor: 'pointer' }} />
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-text)' }}>
              Give anonymously
            </span>
          </label>

          <button onClick={handleLoveOffering} disabled={preparingPayment} style={S.btnPrimary} className="btn-primary">
            {preparingPayment
              ? 'Preparing...'
              : parseFloat(donationAmount || '0') === 0
                ? 'Complete booking (no gift)'
                : `Give $${parseFloat(donationAmount || '0').toFixed(2)}`}
          </button>
        </div>
      )}

      {/* ── Step 4b: Stripe payment form ── */}
      {step === 4 && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
          <PaymentForm
            clientSecret={clientSecret}
            amount={parseFloat(donationAmount || '0')}
            onSuccess={() => setComplete(true)}
          />
        </Elements>
      )}
    </div>
  )
}

// ── Stripe PaymentForm ──
function PaymentForm({ amount, onSuccess }: { clientSecret: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setPayError(null)
    const { error: stripeError } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
    setLoading(false)
    if (stripeError) setPayError(stripeError.message ?? 'Payment failed — please try again.')
    else onSuccess()
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={S.h2}>Complete your giving</h2>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', marginTop: 6, fontSize: '0.875rem' }}>
          Love offering of{' '}
          <strong style={{ color: 'var(--nhlb-red-dark)' }}>${amount.toFixed(2)}</strong>
          {' '}to No Heart Left Behind
        </p>
      </div>

      <PaymentElement />

      {payError && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', color: 'var(--nhlb-red)', marginTop: 12 }}>
          {payError}
        </p>
      )}

      <button onClick={handlePay} disabled={loading || !stripe} style={{ ...S.btnPrimary, marginTop: 20 }} className="btn-primary">
        {loading ? 'Processing...' : `Give $${amount.toFixed(2)}`}
      </button>

      <p style={{
        fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
        color: 'var(--nhlb-muted)', textAlign: 'center', marginTop: 12,
      }}>
        Payments processed securely via Stripe. NHLB never stores your card details.
      </p>
    </div>
  )
}
