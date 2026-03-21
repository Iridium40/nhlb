'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
  }, [])

  const handleSubmit = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
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

  const EyeToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} style={{
      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
      color: 'var(--nhlb-muted)',
    }} aria-label={show ? 'Hide password' : 'Show password'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {show ? (
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
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em',
        padding: '8px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind
      </div>

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
              fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
            }}>
              Set New Password
            </h1>
          </div>

          {success ? (
            <div style={{
              background: '#EAF5EE', border: '1px solid #BBF7D0',
              borderRadius: 12, padding: '24px', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem',
                fontWeight: 600, color: '#065F46', margin: '0 0 12px',
              }}>
                Password Updated
              </p>
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
                color: '#065F46', margin: '0 0 20px', lineHeight: 1.6,
              }}>
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/book" style={{
                  padding: '10px 20px', borderRadius: 8,
                  backgroundColor: 'var(--nhlb-red)', color: 'white',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                  textDecoration: 'none',
                }}>
                  Client Home
                </a>
                <a href="/counselor/login" style={{
                  padding: '10px 20px', borderRadius: 8,
                  backgroundColor: 'white', color: 'var(--nhlb-red-dark)',
                  border: '1px solid var(--nhlb-border)',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.85rem',
                  textDecoration: 'none',
                }}>
                  Counselor Login
                </a>
              </div>
            </div>
          ) : !ready ? (
            <div style={{
              background: 'white', border: '1px solid var(--nhlb-border)',
              borderRadius: 12, padding: '28px', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.875rem',
                color: 'var(--nhlb-muted)', margin: '0 0 16px',
              }}>
                Verifying your reset link...
              </p>
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
                color: 'var(--nhlb-muted)', margin: 0,
              }}>
                If this page doesn&apos;t update, your reset link may have expired. Please request a new one.
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

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...S.input, paddingRight: 40 }}
                    placeholder="At least 6 characters" autoFocus />
                  <EyeToggle show={showPw} toggle={() => setShowPw(!showPw)} />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={S.label}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{ ...S.input, paddingRight: 40 }}
                    placeholder="Re-enter your password" />
                  <EyeToggle show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading} style={{
                width: '100%', padding: '14px 24px', borderRadius: 8, border: 'none',
                backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', opacity: loading ? 0.6 : 1,
              }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
