'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    router.push('/admin/bookings')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 400, width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 4px', textAlign: 'center' }}>
          Admin Login
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: '0 0 24px', textAlign: 'center' }}>
          No Heart Left Behind
        </p>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nhlb-muted)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.9rem', fontFamily: 'Lato, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nhlb-muted)', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8, padding: '10px 14px', paddingRight: 44, fontSize: '0.9rem', fontFamily: 'Lato, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nhlb-muted)', fontSize: '0.8rem',
              }}>{showPw ? '🙈' : '👁'}</button>
            </div>
          </div>
          {error && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#DC2626', margin: '0 0 16px' }}>{error}</p>
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            backgroundColor: 'var(--nhlb-red)', color: 'white', fontFamily: 'Lato, sans-serif',
            fontWeight: 700, fontSize: '0.9rem', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
