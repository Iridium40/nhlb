'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import type { Client, Booking, SessionNote, HipaaFormData } from '@/types'
import AdminNav from '@/components/admin/AdminNav'

interface SearchClient extends Client {
  _match_hipaa?: boolean
  _match_notes?: boolean
  _assigned_counselor?: { id: string; name: string; photo_url: string | null } | null
}

interface Counselor {
  id: string; name: string; title: string | null; photo_url: string | null; is_active: boolean
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  requested:     { backgroundColor: '#F1EFE8', color: '#5F5E5A' },
  call_pending:  { backgroundColor: '#FAEEDA', color: '#633806' },
  call_complete: { backgroundColor: '#E6F1FB', color: '#0C447C' },
  confirmed:     { backgroundColor: '#E1F5EE', color: '#085041' },
  in_session:    { backgroundColor: '#EEEDFE', color: '#3C3489' },
  completed:     { backgroundColor: '#EAF3DE', color: '#27500A' },
  cancelled:     { backgroundColor: '#FCEBEB', color: '#791F1F' },
}

const S = {
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 4,
  } as React.CSSProperties,
}

export default function ClientListPage() {
  const [clients, setClients] = useState<SearchClient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const param = search.trim() ? `?search=${encodeURIComponent(search)}` : ''
    const res = await fetch(`/api/clients${param}`)
    const json = await res.json()
    setClients(json.clients ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const toggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <AdminNav />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, HIPAA info, or session notes..."
          style={{
            width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
            padding: '12px 16px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
            color: 'var(--nhlb-text)', background: 'white', outline: 'none', marginBottom: 8,
          }}
          className="input-brand"
        />

        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: '0 0 20px' }}>
          {loading ? '' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
        ) : clients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--nhlb-muted)' }}>
            {search ? 'No clients match your search' : 'No clients yet'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clients.map(c => (
              <div key={c.id}>
                <button
                  onClick={() => toggle(c.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', textAlign: 'left',
                    background: expandedId === c.id ? 'var(--nhlb-cream)' : 'white',
                    border: expandedId === c.id ? '2px solid var(--nhlb-red)' : '1px solid var(--nhlb-border)',
                    borderRadius: expandedId === c.id ? '12px 12px 0 0' : 10,
                    padding: '16px 20px', cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'var(--nhlb-red-dark)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', fontWeight: 600,
                    }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: 0 }}>
                          {c.first_name} {c.last_name}
                        </p>
                        {search && c._match_hipaa && (
                          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato, sans-serif', backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>HIPAA match</span>
                        )}
                        {search && c._match_notes && (
                          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato, sans-serif', backgroundColor: '#FEF3C7', color: '#92400E' }}>Notes match</span>
                        )}
                      </div>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                        {c.email}{c.phone ? ` · ${c.phone}` : ''}{c.service_type ? ` · ${c.service_type}` : ''}
                      </p>
                      {c._assigned_counselor && (
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-blush)', margin: '3px 0 0' }}>
                          Assigned to {c._assigned_counselor.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '1rem', color: 'var(--nhlb-blush)',
                    transform: expandedId === c.id ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}>&rsaquo;</span>
                </button>

                {expandedId === c.id && (
                  <ClientDetail clientId={c.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientDetail({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null)
  const [assignedCounselor, setAssignedCounselor] = useState<Counselor | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [hipaaCompleted, setHipaaCompleted] = useState(false)
  const [hipaaData, setHipaaData] = useState<HipaaFormData | null>(null)
  const [hipaaCompletedAt, setHipaaCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [clientRes, notesRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/clients/${clientId}/notes`),
      ])
      if (!clientRes.ok) {
        const errJson = await clientRes.json().catch(() => ({}))
        setError(errJson.error ?? `Failed to load client (${clientRes.status})`)
        setLoading(false)
        return
      }
      const clientJson = await clientRes.json()
      const notesJson = await notesRes.json()
      setClient(clientJson.client)
      setAssignedCounselor(clientJson.assignedCounselor ?? null)
      setBookings(clientJson.bookings ?? [])
      setHipaaCompleted(clientJson.hipaaCompleted ?? false)
      setHipaaData(clientJson.hipaaIntake?.form_data ?? null)
      setHipaaCompletedAt(clientJson.hipaaIntake?.completed_at ?? null)
      setNotes(notesJson.notes ?? [])
    } catch {
      setError('Failed to load client details')
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{
      border: '2px solid var(--nhlb-red)', borderTop: 'none',
      borderRadius: '0 0 12px 12px', padding: '32px 24px',
      background: 'white', textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: 0 }}>Loading details...</p>
    </div>
  )

  if (error || !client) return (
    <div style={{
      border: '2px solid var(--nhlb-red)', borderTop: 'none',
      borderRadius: '0 0 12px 12px', padding: '24px',
      background: 'white',
    }}>
      <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C', margin: 0 }}>
          {error ?? 'Client not found'}
        </p>
      </div>
    </div>
  )

  return (
    <div style={{
      border: '2px solid var(--nhlb-red)', borderTop: 'none',
      borderRadius: '0 0 12px 12px', padding: '24px',
      background: 'white',
    }}>
      {/* Quick info badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{
          padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
          fontFamily: 'Lato, sans-serif', backgroundColor: 'var(--nhlb-cream-dark)',
          color: 'var(--nhlb-muted)', textTransform: 'capitalize',
        }}>{client.service_type}</span>
        <span style={{
          padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
          fontFamily: 'Lato, sans-serif',
          backgroundColor: hipaaCompleted ? '#D1FAE5' : '#FEF3C7',
          color: hipaaCompleted ? '#065F46' : '#92400E',
        }}>HIPAA: {hipaaCompleted ? '✓ Complete' : 'Pending'}</span>
        <span style={{
          padding: '3px 12px', borderRadius: 20, fontSize: '0.7rem',
          fontFamily: 'Lato, sans-serif', backgroundColor: 'var(--nhlb-cream-dark)', color: 'var(--nhlb-muted)',
        }}>{bookings.filter(b => b.status !== 'cancelled').length} session{bookings.filter(b => b.status !== 'cancelled').length !== 1 ? 's' : ''}</span>
      </div>

      {client.brief_reason && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          backgroundColor: 'var(--nhlb-cream-dark)', borderRadius: 8,
          borderLeft: '3px solid var(--nhlb-blush)',
        }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '0.95rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.5,
          }}>&ldquo;{client.brief_reason}&rdquo;</p>
        </div>
      )}

      {/* Assigned Counselor */}
      <CounselorReassign client={client} assignedCounselor={assignedCounselor} onReassigned={load} />

      {/* HIPAA */}
      {hipaaCompleted && hipaaData && (
        <HipaaSection data={hipaaData} completedAt={hipaaCompletedAt} />
      )}

      {!hipaaCompleted && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #FCD34D',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: '1rem' }}>⚠</span>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#92400E', margin: 0 }}>
            HIPAA intake form not yet completed.
          </p>
        </div>
      )}

      {/* Session History */}
      <h4 style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem',
        fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 12px',
      }}>Session History</h4>

      {bookings.length === 0 ? (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)' }}>No sessions yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookings.map(b => {
            const note = notes.find(n => n.booking_id === b.id)
            const isExpanded = expandedBooking === b.id
            return (
              <div key={b.id} style={{
                background: 'var(--nhlb-cream)', border: '1px solid var(--nhlb-border)',
                borderRadius: 8, padding: '12px 16px',
                borderLeft: `3px solid ${b.type === 'VIRTUAL' ? '#3B82F6' : 'var(--nhlb-red)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--nhlb-text)' }}>
                        {format(new Date(b.scheduled_at), 'MMM d, yyyy')} at {format(new Date(b.scheduled_at), 'h:mm a')}
                      </span>
                      <span style={{
                        ...STATUS_STYLES[b.status], padding: '1px 8px', borderRadius: 20,
                        fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato, sans-serif', textTransform: 'capitalize',
                      }}>{b.status.replace('_', ' ')}</span>
                      <span style={{
                        padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontFamily: 'Lato, sans-serif',
                        backgroundColor: b.type === 'VIRTUAL' ? '#EFF6FF' : 'var(--nhlb-cream-dark)',
                        color: b.type === 'VIRTUAL' ? '#1D4ED8' : 'var(--nhlb-muted)',
                      }}>{b.type === 'VIRTUAL' ? 'Virtual' : 'In Person'}</span>
                    </div>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                      {b.counselor?.name}{b.donation_amount_cents > 0 ? ` · $${(b.donation_amount_cents / 100).toFixed(2)}` : ''}
                    </p>
                  </div>
                  {b.status !== 'cancelled' && (
                    <button onClick={() => setExpandedBooking(isExpanded ? null : b.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                      color: 'var(--nhlb-red)', padding: 0,
                    }}>{isExpanded ? 'Close' : note?.content ? 'Edit notes' : 'Add notes'}</button>
                  )}
                </div>
                {!isExpanded && note?.content && (
                  <p style={{
                    fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-text)',
                    margin: '8px 0 0', lineHeight: 1.5,
                    padding: '8px 12px', backgroundColor: 'white', borderRadius: 6,
                  }}>{note.content.length > 120 ? note.content.slice(0, 120) + '...' : note.content}</p>
                )}
                {isExpanded && b.status !== 'cancelled' && (
                  <NoteEditor booking={b} clientId={client.id} existingNote={note} onSaved={load} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NoteEditor({ booking, clientId, existingNote, onSaved }: {
  booking: Booking; clientId: string; existingNote?: SessionNote; onSaved: () => void
}) {
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/clients/${clientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: booking.id, counselor_id: booking.counselor_id, content }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  return (
    <div style={{ marginTop: 10, padding: '14px 16px', backgroundColor: 'white', borderRadius: 8, border: '1px solid var(--nhlb-border)' }}>
      <label style={S.label}>Session Notes</label>
      <textarea value={content} onChange={e => setContent(e.target.value)}
        style={{ ...S.input, resize: 'none', marginBottom: 10 }} rows={3}
        placeholder="Session summary, goals discussed, progress..." />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={saving} style={{
          padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
          backgroundColor: 'var(--nhlb-red)', color: 'white',
          fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.75rem',
          opacity: saving ? 0.6 : 1,
        }}>{saving ? 'Saving...' : existingNote ? 'Update' : 'Save'}</button>
        {saved && <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#065F46', fontWeight: 700 }}>Saved</span>}
      </div>
    </div>
  )
}

function CounselorReassign({ client, assignedCounselor, onReassigned }: {
  client: Client; assignedCounselor: Counselor | null; onReassigned: () => void
}) {
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [selectedId, setSelectedId] = useState(client.assigned_counselor_id ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (showPicker && counselors.length === 0) {
      fetch('/api/counselors').then(r => r.json()).then(j => setCounselors(j.counselors ?? []))
    }
  }, [showPicker, counselors.length])

  const save = async () => {
    if (selectedId === (client.assigned_counselor_id ?? '')) { setShowPicker(false); return }
    setSaving(true)
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_counselor_id: selectedId || null }),
    })
    setSaving(false)
    setShowPicker(false)
    onReassigned()
  }

  return (
    <div style={{
      border: '1px solid var(--nhlb-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20,
      background: 'var(--nhlb-cream)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)' }}>
            COUNSELOR
          </span>
          {assignedCounselor && !showPicker && (
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700, color: 'var(--nhlb-red-dark)' }}>
              {assignedCounselor.name}
            </span>
          )}
          {!assignedCounselor && !showPicker && (
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', fontStyle: 'italic' }}>
              Unassigned
            </span>
          )}
        </div>
        <button onClick={() => { setShowPicker(!showPicker); setSelectedId(client.assigned_counselor_id ?? '') }} style={{
          background: 'none', border: '1px solid var(--nhlb-border)', borderRadius: 6,
          padding: '4px 12px', cursor: 'pointer', fontFamily: 'Lato, sans-serif',
          fontSize: '0.7rem', fontWeight: 700, color: 'var(--nhlb-red)',
        }}>{showPicker ? 'Cancel' : assignedCounselor ? 'Reassign' : 'Assign'}</button>
      </div>
      {showPicker && (
        <div style={{ marginTop: 12 }}>
          {counselors.length === 0 ? (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>Loading...</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {counselors.filter(c => c.is_active).map(c => (
                  <button key={c.id} onClick={() => setSelectedId(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: selectedId === c.id ? '2px solid var(--nhlb-red)' : '1px solid var(--nhlb-border)',
                    background: selectedId === c.id ? 'white' : 'var(--nhlb-cream)',
                    textAlign: 'left',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {c.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.photo_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.6rem', color: '#9CA3AF', fontFamily: 'Lato, sans-serif' }}>{c.name.split(' ').map(w => w[0]).join('')}</span>
                      )}
                    </div>
                    <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--nhlb-text)' }}>{c.name}</span>
                    {selectedId === c.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nhlb-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
                <button onClick={() => setSelectedId('')} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: selectedId === '' ? '2px solid var(--nhlb-red)' : '1px solid var(--nhlb-border)',
                  background: selectedId === '' ? 'white' : 'var(--nhlb-cream)',
                  textAlign: 'left',
                }}>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'var(--nhlb-muted)' }}>— Unassign</span>
                </button>
              </div>
              <button onClick={save} disabled={saving} style={{
                padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: 'var(--nhlb-red)', color: 'white',
                fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '0.8rem',
                opacity: saving ? 0.6 : 1, width: '100%',
              }}>{saving ? 'Saving...' : 'Save'}</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function HipaaSection({ data, completedAt }: { data: HipaaFormData; completedAt: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      border: '1px solid var(--nhlb-border)', borderRadius: 10,
      padding: '12px 16px', marginBottom: 20, background: 'var(--nhlb-cream)',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)' }}>
          HIPAA INTAKE
        </span>
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)' }}>
          {open ? '▾ Hide' : '▸ View'}
          {completedAt && !open ? ` · ${format(new Date(completedAt), 'MMM d, yyyy')}` : ''}
        </span>
      </button>
      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.health_history && (
            <div>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>HEALTH HISTORY</p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{data.health_history}</p>
            </div>
          )}
          {data.current_medications && (
            <div>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>MEDICATIONS</p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{data.current_medications}</p>
            </div>
          )}
          {data.allergies && (
            <div>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>ALLERGIES</p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', margin: 0, lineHeight: 1.6 }}>{data.allergies}</p>
            </div>
          )}
          {(data.emergency_contact_name || data.emergency_contact_phone) && (
            <div style={{ padding: '10px 14px', backgroundColor: 'white', borderRadius: 6 }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--nhlb-muted)', margin: '0 0 4px' }}>EMERGENCY CONTACT</p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--nhlb-text)', margin: 0 }}>
                {data.emergency_contact_name}
                {data.emergency_contact_relationship && <span style={{ fontWeight: 400, color: 'var(--nhlb-muted)' }}> ({data.emergency_contact_relationship})</span>}
              </p>
              {data.emergency_contact_phone && (
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-muted)', margin: 0 }}>{data.emergency_contact_phone}</p>
              )}
            </div>
          )}
          {completedAt && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', color: 'var(--nhlb-muted)', margin: 0, fontStyle: 'italic' }}>
              Completed {format(new Date(completedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
