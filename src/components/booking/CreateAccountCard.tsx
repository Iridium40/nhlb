'use client'

import { useState } from 'react'

export default function CreateAccountCard({ clientId, email }: { clientId: string; email: string }) {
  const [expanded, setExpanded] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPw) { setError('Passwords do not match.'); return }
    setCreating(true)
    setError(null)
    const res = await fetch('/api/auth/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, clientId }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Could not create account.'); setCreating(false); return }
    setDone(true)
    setCreating(false)
  }

  if (done) {
    return (
      <div style={{
        background: '#EAF5EE', border: '1px solid #BBF7D0',
        borderRadius: 12, padding: '20px 24px', textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, color: '#065F46', fontSize: '0.875rem', margin: 0 }}>
          Account created! You can now log in for faster bookings.
        </p>
      </div>
    )
  }

  if (!expanded) {
    return (
      <div style={{
        background: 'white', border: '1px solid var(--nhlb-border)',
        borderRadius: 12, padding: '20px 24px', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', marginBottom: 6,
        }}>
          Save your card for future visits?
        </p>
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
          color: 'var(--nhlb-muted)', marginBottom: 14,
        }}>
          Create an optional account for faster booking next time.
        </p>
        <button onClick={() => setExpanded(true)} style={{
          padding: '10px 24px', borderRadius: 8,
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
          border: 'none', cursor: 'pointer',
        }}>
          Create Account
        </button>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  }

  return (
    <div style={{
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 12, padding: '24px',
    }}>
      <p style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem',
        fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 4px',
      }}>
        Create your account
      </p>
      <p style={{
        fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
        color: 'var(--nhlb-muted)', margin: '0 0 16px',
      }}>
        Email: <strong>{email}</strong>
      </p>

      {error && (
        <div style={{
          marginBottom: 12, padding: '10px 14px',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#B91C1C',
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{
          display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
          fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4,
        }}>PASSWORD</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          style={inputStyle} placeholder="At least 8 characters" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
          fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', marginBottom: 4,
        }}>CONFIRM PASSWORD</label>
        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
          style={inputStyle} placeholder="Re-enter password" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleCreate} disabled={creating} style={{
          padding: '10px 22px', borderRadius: 8,
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
          border: 'none', cursor: 'pointer', opacity: creating ? 0.6 : 1,
        }}>
          {creating ? 'Creating...' : 'Create Account'}
        </button>
        <button onClick={() => setExpanded(false)} style={{
          padding: '10px 16px', borderRadius: 8,
          backgroundColor: 'white', color: 'var(--nhlb-muted)',
          fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', border: '1px solid var(--nhlb-border)',
          cursor: 'pointer',
        }}>
          Skip
        </button>
      </div>
    </div>
  )
}
