'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function CounselorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Verify this user is a counselor
    const res = await fetch('/api/counselor/me')
    if (!res.ok) {
      setError('This account is not linked to a counselor profile. Contact the administrator.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push('/counselor')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        Counselor Portal
      </div>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
              alt="NHLB" style={{ height: 64, width: 'auto', margin: '0 auto 16px' }}
            />
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
            }}>
              Counselor Sign In
            </h1>
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '12px 14px',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
            }}>
              {error}
            </div>
          )}

          <div style={{
            background: 'white', border: '1px solid var(--nhlb-border)',
            borderRadius: 12, padding: '28px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
                fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--nhlb-muted)', marginBottom: 6,
              }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
                  padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
                  color: 'var(--nhlb-text)', background: 'white', outline: 'none',
                }} className="input-brand" placeholder="counselor@noheartleftbehind.com" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
                fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--nhlb-muted)', marginBottom: 6,
              }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
                  padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
                  color: 'var(--nhlb-text)', background: 'white', outline: 'none',
                }} className="input-brand" />
            </div>
            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none',
              backgroundColor: 'var(--nhlb-red)', color: 'white',
              fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', opacity: loading ? 0.6 : 1,
            }} className="btn-primary">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
            color: 'var(--nhlb-muted)', textAlign: 'center', marginTop: 20,
          }}>
            Need an account? Contact the administrator to set up your counselor login.
          </p>
        </div>
      </main>
    </div>
  )
}
