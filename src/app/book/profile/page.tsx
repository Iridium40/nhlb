'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const S = {
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputReadonly: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-muted)', background: '#F9FAFB', outline: 'none',
    boxSizing: 'border-box' as const,
  },
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 6,
  },
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [originalPhone, setOriginalPhone] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/client/profile')
        if (res.status === 401) { router.replace('/book'); return }
        const json = await res.json()
        if (json.client) {
          setFirstName(json.client.first_name ?? '')
          setLastName(json.client.last_name ?? '')
          setEmail(json.client.email ?? '')
          setPhone(json.client.phone ?? '')
          setOriginalEmail(json.client.email ?? '')
          setOriginalPhone(json.client.phone ?? '')
        }
      } catch {
        router.replace('/book')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const hasChanges = email !== originalEmail || phone !== originalPhone

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Could not update profile.')
        setSaving(false)
        return
      }
      setOriginalEmail(json.client.email)
      setOriginalPhone(json.client.phone ?? '')
      setToast('Profile updated successfully!')
      setTimeout(() => setToast(null), 3000)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        My Profile
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 64,
      }}>
        <Link href="/book" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; Back</Link>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 0 20px',
        }}>My Profile</h1>
      </header>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#065F46', color: 'white', padding: '12px 24px',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.875rem',
          fontWeight: 600, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '28px',
        }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 24px',
          }}>
            Personal Information
          </h2>

          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 14px',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={S.label}>First name</label>
              <input value={firstName} readOnly style={S.inputReadonly} />
            </div>
            <div>
              <label style={S.label}>Last name</label>
              <input value={lastName} readOnly style={S.inputReadonly} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={S.input} className="input-brand" />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={S.label}>Phone number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              style={S.input} className="input-brand" />
          </div>

          <button onClick={handleSave} disabled={!hasChanges || saving} style={{
            width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none',
            backgroundColor: hasChanges ? 'var(--nhlb-red)' : 'var(--nhlb-blush-light)',
            color: hasChanges ? 'white' : 'var(--nhlb-muted)',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
