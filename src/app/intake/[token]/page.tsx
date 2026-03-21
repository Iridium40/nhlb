'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { HipaaFormData } from '@/types'

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

export default function HipaaIntakePage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('')
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<HipaaFormData>({
    health_history: '',
    current_medications: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    consent_given: false,
  })

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/intake/${token}`)
      if (!res.ok) { setNotFound(true); setLoading(false); return }
      const json = await res.json()
      setClientName(json.clientName ?? '')
      if (json.intake.completed_at) setAlreadyDone(true)
      setLoading(false)
    })()
  }, [token])

  const update = (field: keyof HipaaFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.consent_given) {
      setError('Please acknowledge the consent to proceed.')
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/intake/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: form }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSubmitting(false); return }
    setSubmitted(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--nhlb-red-dark)' }}>Form Not Found</h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>This intake link is invalid or has expired.</p>
      </div>
    </div>
  )

  if (alreadyDone || submitted) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', backgroundColor: '#EAF5EE',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2D7A4F" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--nhlb-red-dark)', fontSize: '1.8rem' }}>
          {submitted ? 'Thank you!' : 'Already Submitted'}
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>
          {submitted
            ? 'Your intake form has been submitted. We look forward to meeting you.'
            : 'This intake form has already been completed.'}
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Confidential Health Intake Form
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 6px' }}>
          HIPAA Intake Form
        </h1>
        {clientName && (
          <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', marginBottom: 8 }}>
            For: <strong style={{ color: 'var(--nhlb-red-dark)' }}>{clientName}</strong>
          </p>
        )}
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 32 }}>
          This information is protected under HIPAA and will only be shared with your counselor. Please complete this form before your first session.
        </p>

        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 16px',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={S.label}>Health history</label>
            <textarea value={form.health_history} onChange={e => update('health_history', e.target.value)}
              style={{ ...S.input, resize: 'none' }} className="input-brand" rows={4}
              placeholder="Please describe any current or past health conditions, surgeries, or hospitalizations..." />
          </div>

          <div>
            <label style={S.label}>Current medications</label>
            <textarea value={form.current_medications} onChange={e => update('current_medications', e.target.value)}
              style={{ ...S.input, resize: 'none' }} className="input-brand" rows={3}
              placeholder="List any medications you are currently taking, including dosage..." />
          </div>

          <div>
            <label style={S.label}>Allergies</label>
            <input value={form.allergies} onChange={e => update('allergies', e.target.value)}
              style={S.input} className="input-brand"
              placeholder="List any known allergies (medications, food, environmental)..." />
          </div>

          <div style={{
            backgroundColor: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 16 }}>
              EMERGENCY CONTACT
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ ...S.label, fontSize: '0.7rem' }}>Name</label>
                <input value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)}
                  style={S.input} className="input-brand" placeholder="Full name" />
              </div>
              <div>
                <label style={{ ...S.label, fontSize: '0.7rem' }}>Phone</label>
                <input value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)}
                  style={S.input} className="input-brand" placeholder="(555) 555-0100" type="tel" />
              </div>
            </div>
            <div>
              <label style={{ ...S.label, fontSize: '0.7rem' }}>Relationship</label>
              <input value={form.emergency_contact_relationship} onChange={e => update('emergency_contact_relationship', e.target.value)}
                style={S.input} className="input-brand" placeholder="e.g. Spouse, Parent, Sibling" />
            </div>
          </div>

          <div style={{
            backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.consent_given}
                onChange={e => update('consent_given', e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--nhlb-red)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#92400E', lineHeight: 1.5 }}>
                I acknowledge that the information I have provided is accurate and complete to the best of my knowledge. I consent to the use of this information for the purpose of counseling services at No Heart Left Behind. I understand this information is protected under HIPAA.
              </span>
            </label>
          </div>

          <button onClick={handleSubmit} disabled={submitting || !form.consent_given}
            style={{
              width: '100%', backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              padding: '14px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
              opacity: submitting || !form.consent_given ? 0.5 : 1,
            }} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Intake Form'}
          </button>
        </div>
      </div>
    </div>
  )
}
