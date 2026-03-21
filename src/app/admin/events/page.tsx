'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import type { Event } from '@/types'

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
    fontWeight: 700, fontSize: '0.8rem',
  } as React.CSSProperties),
}

function EventForm({ event, onSaved, onCancel }: {
  event?: Event
  onSaved: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventDate, setEventDate] = useState(event ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : '')
  const [endDate, setEndDate] = useState(event?.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [feeCents, setFeeCents] = useState(event ? String(event.registration_fee_cents / 100) : '0')
  const [feeLabel, setFeeLabel] = useState(event?.fee_label ?? 'Registration Fee')
  const [maxCapacity, setMaxCapacity] = useState(event?.max_capacity ? String(event.max_capacity) : '')
  const [isActive, setIsActive] = useState(event?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title || !eventDate) return
    setSaving(true)
    const payload = {
      title,
      description: description || null,
      event_date: new Date(eventDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
      location: location || null,
      registration_fee_cents: Math.round(parseFloat(feeCents || '0') * 100),
      fee_label: feeLabel || 'Registration Fee',
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      is_active: isActive,
    }
    const url = event ? `/api/events/${event.id}` : '/api/events'
    await fetch(url, {
      method: event ? 'PATCH' : 'POST',
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
      <div style={{ marginBottom: 16 }}><label style={S.label}>Title *</label><input value={title} onChange={e => setTitle(e.target.value)} style={S.input} /></div>
      <div style={{ marginBottom: 16 }}><label style={S.label}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...S.input, resize: 'none' }} rows={3} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div><label style={S.label}>Start date/time *</label><input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={S.input} /></div>
        <div><label style={S.label}>End date/time</label><input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} style={S.input} /></div>
      </div>
      <div style={{ marginBottom: 16 }}><label style={S.label}>Location</label><input value={location} onChange={e => setLocation(e.target.value)} style={S.input} placeholder="430 N. Jefferson Ave, Covington, LA" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div><label style={S.label}>Fee ($)</label><input type="number" min="0" step="0.01" value={feeCents} onChange={e => setFeeCents(e.target.value)} style={S.input} /></div>
        <div><label style={S.label}>Fee label</label><input value={feeLabel} onChange={e => setFeeLabel(e.target.value)} style={S.input} /></div>
        <div><label style={S.label}>Max capacity</label><input type="number" min="0" value={maxCapacity} onChange={e => setMaxCapacity(e.target.value)} style={S.input} placeholder="Unlimited" /></div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }} />
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem' }}>Published (visible to public)</span>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving || !title || !eventDate} style={S.btn('var(--nhlb-red)', 'white')}>
          {saving ? 'Saving...' : event ? 'Update' : 'Create Event'}
        </button>
        <button onClick={onCancel} style={S.btn('white', 'var(--nhlb-muted)')}>Cancel</button>
      </div>
    </div>
  )
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/events?all=true')
    const json = await res.json()
    setEvents(json.events ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    load()
  }

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
          }}>Events</h1>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }} style={S.btn('var(--nhlb-red)', 'white')}>
          + Create Event
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {showForm && !editingId && (
          <EventForm onSaved={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
        ) : events.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--nhlb-muted)' }}>
            No events yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(ev => (
              editingId === ev.id ? (
                <EventForm key={ev.id} event={ev} onSaved={() => { setEditingId(null); load() }} onCancel={() => setEditingId(null)} />
              ) : (
                <div key={ev.id} style={{
                  background: 'white', border: '1px solid var(--nhlb-border)',
                  borderRadius: 12, padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                          {ev.title}
                        </p>
                        <span style={{
                          padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                          fontFamily: 'Lato, sans-serif',
                          backgroundColor: ev.is_active ? '#D1FAE5' : '#FEE2E2',
                          color: ev.is_active ? '#065F46' : '#991B1B',
                        }}>
                          {ev.is_active ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', margin: '0 0 4px' }}>
                        📅 {format(new Date(ev.event_date), 'EEE, MMM d, yyyy h:mm a')}
                        {ev.location ? ` · 📍 ${ev.location}` : ''}
                      </p>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                        👥 {ev.registration_count ?? 0} registered
                        {ev.max_capacity ? ` / ${ev.max_capacity} max` : ''}
                        {ev.registration_fee_cents > 0 ? ` · $${(ev.registration_fee_cents / 100).toFixed(2)} ${ev.fee_label}` : ' · Free'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={`/admin/events/${ev.id}`} style={{
                        ...S.btn('var(--nhlb-cream-dark)', 'var(--nhlb-text)'),
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                      }}>Attendees</a>
                      <button onClick={() => setEditingId(ev.id)} style={S.btn('white', 'var(--nhlb-muted)')}>Edit</button>
                      <a href={`/api/events/${ev.id}/registrations/export`} style={{
                        ...S.btn('white', 'var(--nhlb-muted)'),
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                        border: '1px solid var(--nhlb-border)',
                      }}>CSV ↓</a>
                      <button onClick={() => handleDelete(ev.id, ev.title)} style={S.btn('white', '#DC2626')}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
