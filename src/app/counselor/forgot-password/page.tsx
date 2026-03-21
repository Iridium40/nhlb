'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function CounselorForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const S = {
    input: {
      width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
      padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
      color: 'var(--nhlb-text)', background: 'white', outline: 'none',
      boxSizing: 'border-box' as const,
    },
    label: {
      display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
      color: 'var(--nhlb-muted)', marginBottom: 6,
    },
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

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center', height: 56,
      }}>
        <Link href="/counselor/login" style={{
          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
          color: 'var(--nhlb-muted)', textDecoration: 'none',
        }}>&larr; Back to Sign In</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.squarespace-cdn.com/content/v1/5e82146501b2e061b5579be0/1587480392593-WRDXDIU2H6V7O9536SHX/NHLBlogo.png?format=300w"
              alt="NHLB" style={{ height: 56, width: 'auto', margin: '0 auto 16px' }}
            />
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem',
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
            }}>
              Reset Your Password
            </h1>
            <p style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.875rem',
              color: 'var(--nhlb-muted)', margin: 0,
            }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {sent ? (
            <div style={{
              background: '#EAF5EE', border: '1px solid #BBF7D0',
              borderRadius: 12, padding: '24px', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
                fontWeight: 600, color: '#065F46', margin: '0 0 8px',
              }}>
                Check your email
              </p>
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
                color: '#065F46', margin: 0, lineHeight: 1.6,
              }}>
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: '28px',
            }}>
              {error && (
                <div style={{
                  marginBottom: 16, padding: '12px 14px',
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={S.input} placeholder="counselor@noheartleftbehind.com" autoFocus />
              </div>

              <button onClick={handleSubmit} disabled={loading} style={{
                width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none',
                backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', opacity: loading ? 0.6 : 1,
              }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
