'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Counselor, CounselorAvailability } from '@/types'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 7
  return { value: `${String(h).padStart(2, '0')}:00`, label: `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}` }
})

const S = {
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 4,
  } as React.CSSProperties,
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
  btn: (bg: string, color: string) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
    backgroundColor: bg, color, fontFamily: 'Lato, sans-serif',
    fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em',
  } as React.CSSProperties),
}

function AvailabilityEditor({ counselorId }: { counselorId: string }) {
  const [slots, setSlots] = useState<CounselorAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('17:00')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/counselors/${counselorId}/availability`)
    const json = await res.json()
    setSlots(json.slots ?? [])
    setLoading(false)
  }, [counselorId])

  useEffect(() => { load() }, [load])

  const addSlot = async () => {
    setSaving(true)
    await fetch(`/api/counselors/${counselorId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_of_week: newDay, start_time: newStart, end_time: newEnd }),
    })
    await load()
    setSaving(false)
  }

  const removeSlot = async (slotId: string) => {
    await fetch(`/api/counselors/${counselorId}/availability`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    })
    await load()
  }

  if (loading) return <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>Loading hours...</p>

  const grouped = DAYS.map((day, i) => ({
    day,
    dayNum: i,
    windows: slots.filter(s => s.day_of_week === i),
  })).filter(g => g.windows.length > 0)

  return (
    <div style={{ marginTop: 12 }}>
      {grouped.length === 0 && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', fontStyle: 'italic' }}>
          No availability set
        </p>
      )}
      {grouped.map(g => (
        <div key={g.dayNum} style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--nhlb-text)' }}>
            {g.day}
          </span>
          {g.windows.map(w => (
            <div key={w.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>
                {w.start_time.slice(0, 5)} &ndash; {w.end_time.slice(0, 5)}
              </span>
              <button onClick={() => removeSlot(w.id)} style={{
                background: 'none', border: 'none', color: '#DC2626',
                cursor: 'pointer', fontSize: '0.8rem', padding: 0,
              }}>&times;</button>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginTop: 12, flexWrap: 'wrap' }}>
        <div>
          <label style={S.label}>Day</label>
          <select value={newDay} onChange={e => setNewDay(Number(e.target.value))}
            style={{ ...S.input, width: 140 }}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Start</label>
          <select value={newStart} onChange={e => setNewStart(e.target.value)}
            style={{ ...S.input, width: 110 }}>
            {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>End</label>
          <select value={newEnd} onChange={e => setNewEnd(e.target.value)}
            style={{ ...S.input, width: 110 }}>
            {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
          </select>
        </div>
        <button onClick={addSlot} disabled={saving} style={S.btn('var(--nhlb-red)', 'white')}>
          {saving ? 'Adding...' : '+ Add'}
        </button>
      </div>
    </div>
  )
}

function CounselorForm({ counselor, onSaved, onCancel }: {
  counselor?: Counselor
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(counselor?.name ?? '')
  const [title, setTitle] = useState(counselor?.title ?? '')
  const [bio, setBio] = useState(counselor?.bio ?? '')
  const [email, setEmail] = useState(counselor?.email ?? '')
  const [phone, setPhone] = useState(counselor?.phone ?? '')
  const [zoomLink, setZoomLink] = useState(counselor?.zoom_link ?? '')
  const [specialties, setSpecialties] = useState(counselor?.specialties?.join(', ') ?? '')
  const [isActive, setIsActive] = useState(counselor?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name, title,
      bio: bio || null,
      email: email || null,
      phone: phone || null,
      zoom_link: zoomLink || null,
      specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
      is_active: isActive,
    }
    const url = counselor ? `/api/counselors/${counselor.id}` : '/api/counselors'
    await fetch(url, {
      method: counselor ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div style={{
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 12, padding: '24px', marginBottom: 16,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div><label style={S.label}>Name *</label><input value={name} onChange={e => setName(e.target.value)} style={S.input} /></div>
        <div><label style={S.label}>Title *</label><input value={title} onChange={e => setTitle(e.target.value)} style={S.input} /></div>
        <div><label style={S.label}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} style={S.input} type="email" /></div>
        <div><label style={S.label}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={S.input} /></div>
      </div>
      <div style={{ marginBottom: 16 }}><label style={S.label}>Zoom Link</label><input value={zoomLink} onChange={e => setZoomLink(e.target.value)} style={S.input} placeholder="https://zoom.us/j/..." /></div>
      <div style={{ marginBottom: 16 }}><label style={S.label}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} style={{ ...S.input, resize: 'none' }} rows={3} /></div>
      <div style={{ marginBottom: 16 }}><label style={S.label}>Specialties (comma-separated)</label><input value={specialties} onChange={e => setSpecialties(e.target.value)} style={S.input} placeholder="marriage, family, trauma" /></div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }} />
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem' }}>Active (visible to clients)</span>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving || !name || !title} style={S.btn('var(--nhlb-red)', 'white')}>
          {saving ? 'Saving...' : counselor ? 'Update' : 'Create'}
        </button>
        <button onClick={onCancel} style={S.btn('white', 'var(--nhlb-muted)')}>Cancel</button>
      </div>
    </div>
  )
}

function CreateLoginForm({ counselor, onDone }: { counselor: Counselor; onDone: () => void }) {
  const [loginEmail, setLoginEmail] = useState(counselor.email ?? '')
  const [loginPassword, setLoginPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCreate = async () => {
    setError(null)
    setCreating(true)
    const res = await fetch('/api/counselors/create-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counselorId: counselor.id, email: loginEmail, password: loginPassword }),
    })
    const json = await res.json()
    setCreating(false)
    if (!res.ok) { setError(json.error); return }
    setSuccess(true)
    setTimeout(onDone, 1500)
  }

  if (success) return (
    <div style={{
      marginTop: 12, padding: '12px 16px', backgroundColor: '#D1FAE5',
      borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#065F46',
    }}>
      Login created! {counselor.name} can now sign in at <strong>/counselor/login</strong>
    </div>
  )

  return (
    <div style={{ marginTop: 12, padding: '16px', backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 8 }}>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 10px' }}>
        CREATE COUNSELOR LOGIN
      </p>
      {error && (
        <div style={{ marginBottom: 10, padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#B91C1C' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={S.label}>Email</label>
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={S.input} placeholder="counselor@noheartleftbehind.com" />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={S.label}>Password</label>
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={S.input} placeholder="Min 6 characters" />
        </div>
        <button onClick={handleCreate} disabled={creating || !loginEmail || loginPassword.length < 6}
          style={{ ...S.btn('#065F46', 'white'), opacity: creating || !loginEmail || loginPassword.length < 6 ? 0.5 : 1 }}>
          {creating ? 'Creating...' : 'Create Login'}
        </button>
      </div>
    </div>
  )
}

function CounselorCard({ counselor, onEdit, onRefresh }: {
  counselor: Counselor
  onEdit: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete ${counselor.name}?`)) return
    await fetch(`/api/counselors/${counselor.id}`, { method: 'DELETE' })
    onRefresh()
  }

  const hasLogin = !!counselor.supabase_user_id

  return (
    <div style={{
      background: 'white', border: '1px solid var(--nhlb-border)',
      borderRadius: 12, padding: '20px 24px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
              {counselor.name}
            </p>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
              backgroundColor: counselor.is_active ? '#D1FAE5' : '#FEE2E2',
              color: counselor.is_active ? '#065F46' : '#991B1B',
            }}>
              {counselor.is_active ? 'Active' : 'Inactive'}
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
              backgroundColor: hasLogin ? '#EFF6FF' : '#FEF3C7',
              color: hasLogin ? '#1D4ED8' : '#92400E',
            }}>
              {hasLogin ? 'Has Login' : 'No Login'}
            </span>
          </div>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '0 0 6px' }}>{counselor.title}</p>
          {counselor.email && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '2px 0' }}>{counselor.email}</p>}
          {counselor.phone && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: '2px 0' }}>{counselor.phone}</p>}
          {counselor.zoom_link && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#1D4ED8', margin: '2px 0', wordBreak: 'break-all' }}>Zoom: {counselor.zoom_link}</p>}
          {counselor.specialties?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {counselor.specialties.map(s => (
                <span key={s} style={{
                  padding: '2px 10px', backgroundColor: 'var(--nhlb-cream-dark)',
                  color: 'var(--nhlb-muted)', borderRadius: 20, fontSize: '0.7rem',
                  fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!hasLogin && (
            <button onClick={() => setShowLoginForm(!showLoginForm)} style={S.btn('#065F46', 'white')}>
              Create Login
            </button>
          )}
          <button onClick={onEdit} style={S.btn('var(--nhlb-cream-dark)', 'var(--nhlb-text)')}>Edit</button>
          <button onClick={handleDelete} style={S.btn('white', '#DC2626')}>Delete</button>
        </div>
      </div>

      {showLoginForm && !hasLogin && (
        <CreateLoginForm counselor={counselor} onDone={() => { setShowLoginForm(false); onRefresh() }} />
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            color: 'var(--nhlb-red)', padding: 0,
          }}
        >
          {expanded ? '▾ Hide availability' : '▸ Manage availability hours'}
        </button>
      </div>
      {expanded && <AvailabilityEditor counselorId={counselor.id} />}
    </div>
  )
}

export default function CounselorsPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/counselors')
    const json = await res.json()
    setCounselors(json.counselors ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <div style={{
        backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
        textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '7px 16px', fontFamily: 'Lato, sans-serif',
      }}>
        No Heart Left Behind &mdash; Admin
      </div>

      <header style={{
        backgroundColor: 'white', borderBottom: '1px solid var(--nhlb-blush-light)',
        padding: '0 40px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin/bookings" style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
            color: 'var(--nhlb-muted)', textDecoration: 'none',
          }}>&larr; Bookings</a>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem',
            fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0,
          }}>Counselors</h1>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }} style={S.btn('var(--nhlb-red)', 'white')}>
          + Add Counselor
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {showForm && !editingId && (
          <CounselorForm
            onSaved={() => { setShowForm(false); load() }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
        ) : counselors.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
            No counselors yet
          </p>
        ) : (
          counselors.map(c => (
            editingId === c.id ? (
              <CounselorForm
                key={c.id}
                counselor={c}
                onSaved={() => { setEditingId(null); load() }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <CounselorCard
                key={c.id}
                counselor={c}
                onEdit={() => setEditingId(c.id)}
                onRefresh={load}
              />
            )
          ))
        )}
      </div>
    </div>
  )
}
