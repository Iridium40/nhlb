'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Counselor } from '@/types'
import CounselorNav from '@/components/counselor/CounselorNav'

const SPECIALTY_OPTIONS = [
  'Individual Counseling', 'Couples Counseling', 'Family Counseling',
  'Grief & Loss', 'Anxiety & Depression', 'Trauma & PTSD',
  'Substance Abuse', 'Anger Management', 'Self-Esteem',
  'Spiritual Direction', 'Pre-Marital', 'Youth Counseling',
]

export default function CounselorProfilePage() {
  const router = useRouter()
  const [counselor, setCounselor] = useState<Counselor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zoomLink, setZoomLink] = useState('')
  const [zoomMeetingId, setZoomMeetingId] = useState('')
  const [zoomPasscode, setZoomPasscode] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/counselor/me')
    if (!res.ok) { router.push('/counselor/login'); return }
    const json = await res.json()
    const c: Counselor = json.counselor
    setCounselor(c)
    setName(c.name ?? '')
    setTitle(c.title ?? '')
    setBio(c.bio ?? '')
    setEmail(c.email ?? '')
    setPhone(c.phone ?? '')
    setZoomLink(c.zoom_link ?? '')
    setZoomMeetingId(c.zoom_meeting_id ?? '')
    setZoomPasscode(c.zoom_passcode ?? '')
    setPhotoUrl(c.photo_url ?? '')
    setSpecialties(c.specialties ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/counselor/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, title, bio, email, phone,
        zoom_link: zoomLink,
        zoom_meeting_id: zoomMeetingId || null,
        zoom_passcode: zoomPasscode || null,
        specialties,
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to save')
      setSaving(false)
      return
    }
    const json = await res.json()
    setCounselor(json.counselor)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleSpecialty = (s: string) => {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/counselor/photo', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Upload failed'); return }
      setPhotoUrl(json.photo_url)
      setCounselor(json.counselor)
    } catch {
      setError('Upload failed — please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handlePhotoRemove = async () => {
    if (!confirm('Remove your profile photo?')) return
    setRemoving(true)
    setError(null)
    try {
      const res = await fetch('/api/counselor/photo', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Remove failed'); return }
      setPhotoUrl('')
      setCounselor(json.counselor)
    } catch {
      setError('Remove failed — please try again.')
    } finally {
      setRemoving(false)
    }
  }

  const S = {
    label: {
      display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
      fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
      color: 'var(--nhlb-muted)', marginBottom: 6,
    } as React.CSSProperties,
    input: {
      width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
      padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
      color: 'var(--nhlb-text)', background: 'white', outline: 'none',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    card: {
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 12, padding: '24px', marginBottom: 20,
    },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading profile...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <CounselorNav />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center', marginBottom: 20 }}>
          {saved && <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#065F46', fontWeight: 700 }}>Saved</span>}
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            backgroundColor: 'var(--nhlb-red)', color: 'white',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: 16, padding: '12px 16px',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
          }}>
            {error}
          </div>
        )}

        {/* Basic info */}
        <div style={S.card}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: 'var(--nhlb-red-dark)', margin: '0 0 20px' }}>
            Basic Information
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Profile Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid var(--nhlb-border)', backgroundColor: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{
                  padding: '7px 16px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
                  backgroundColor: 'white', color: 'var(--nhlb-text)',
                  fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
                  cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1,
                  textAlign: 'center',
                }}>
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                {photoUrl && (
                  <button onClick={handlePhotoRemove} disabled={removing} style={{
                    padding: '7px 16px', borderRadius: 8,
                    border: '1px solid #FECACA', backgroundColor: '#FEF2F2',
                    color: '#B91C1C', fontFamily: 'Lato, sans-serif',
                    fontWeight: 700, fontSize: '0.75rem',
                    cursor: removing ? 'not-allowed' : 'pointer',
                    opacity: removing ? 0.6 : 1,
                  }}>
                    {removing ? 'Removing...' : 'Remove Photo'}
                  </button>
                )}
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', color: 'var(--nhlb-muted)' }}>
                  JPEG, PNG, or WebP · Max 5 MB
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={S.label}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Title / Role</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={S.input} placeholder="e.g. Licensed Counselor" />
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={S.label}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              style={{ ...S.input, resize: 'vertical', minHeight: 80 }} rows={3}
              placeholder="A brief bio that clients will see on the booking page..." />
          </div>
        </div>

        {/* Contact info */}
        <div style={S.card}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: 'var(--nhlb-red-dark)', margin: '0 0 20px' }}>
            Contact Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={S.label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={S.input} placeholder="985-555-0100" />
            </div>
          </div>
          <div>
            <label style={S.label}>Zoom Link</label>
            <input value={zoomLink} onChange={e => setZoomLink(e.target.value)} style={S.input}
              placeholder="https://zoom.us/j/..." />
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: '6px 0 0', fontStyle: 'italic' }}>
              Your personal Zoom meeting room link
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={S.label}>Meeting ID</label>
              <input value={zoomMeetingId} onChange={e => setZoomMeetingId(e.target.value)} style={S.input}
                placeholder="636 585 7340" />
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: '6px 0 0', fontStyle: 'italic' }}>
                Your Zoom meeting ID number
              </p>
            </div>
            <div>
              <label style={S.label}>Passcode</label>
              <input value={zoomPasscode} onChange={e => setZoomPasscode(e.target.value)} style={S.input}
                placeholder="202020" />
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: '6px 0 0', fontStyle: 'italic' }}>
                Meeting passcode (if required)
              </p>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div style={S.card}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', color: 'var(--nhlb-red-dark)', margin: '0 0 16px' }}>
            Specialties
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIALTY_OPTIONS.map(s => {
              const active = specialties.includes(s)
              return (
                <button key={s} onClick={() => toggleSpecialty(s)} style={{
                  padding: '6px 14px', borderRadius: 20, border: '1px solid',
                  borderColor: active ? 'var(--nhlb-red)' : 'var(--nhlb-border)',
                  backgroundColor: active ? 'var(--nhlb-red)' : 'white',
                  color: active ? 'white' : 'var(--nhlb-muted)',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  {s}
                </button>
              )
            })}
          </div>
          {specialties.filter(s => !SPECIALTY_OPTIONS.includes(s)).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: '0 0 6px' }}>Custom specialties:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {specialties.filter(s => !SPECIALTY_OPTIONS.includes(s)).map(s => (
                  <span key={s} style={{
                    padding: '4px 12px', borderRadius: 20, backgroundColor: '#EFF6FF',
                    color: '#1D4ED8', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    {s}
                    <button onClick={() => setSpecialties(prev => prev.filter(x => x !== s))} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8',
                      fontSize: '0.85rem', padding: 0, lineHeight: 1,
                    }}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
          <a href="/counselor/availability" style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
            backgroundColor: 'white', color: 'var(--nhlb-text)',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            textDecoration: 'none',
          }}>
            Manage Availability
          </a>
          <a href="/counselor" style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid var(--nhlb-border)',
            backgroundColor: 'white', color: 'var(--nhlb-text)',
            fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
            textDecoration: 'none',
          }}>
            View Schedule
          </a>
        </div>
      </div>
    </div>
  )
}
