'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import CounselorNav from '@/components/counselor/CounselorNav'
import type { Client, TimeSlot } from '@/types'

const S = {
  label: {
    display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    color: 'var(--nhlb-muted)', marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%', border: '1px solid var(--nhlb-border)', borderRadius: 8,
    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'Lato, sans-serif',
    color: 'var(--nhlb-text)', background: 'white', outline: 'none',
  } as React.CSSProperties,
  btn: (bg: string, color: string) => ({
    padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
    backgroundColor: bg, color, fontFamily: 'Lato, sans-serif',
    fontWeight: 700, fontSize: '0.875rem',
  } as React.CSSProperties),
}

export default function CounselorSchedulePage() {
  const [counselorId, setCounselorId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON')
  const [scheduledAt, setScheduledAt] = useState('')

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  const [useSlots, setUseSlots] = useState(true)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const profileRes = await fetch('/api/counselor/me')
    const profileJson = await profileRes.json()
    const cId = profileJson.counselor?.id
    if (!cId) { setLoading(false); return }
    setCounselorId(cId)

    const clientsRes = await fetch('/api/counselor/clients')
    const clientsJson = await clientsRes.json()
    setClients(clientsJson.clients ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadSlots = useCallback(async () => {
    if (!counselorId) return
    setLoadingSlots(true)
    const res = await fetch(`/api/booking/availability?counselorId=${counselorId}`)
    const json = await res.json()
    setSlots(json.slots ?? [])
    setLoadingSlots(false)
  }, [counselorId])

  useEffect(() => {
    if (counselorId && useSlots) loadSlots()
  }, [counselorId, useSlots, loadSlots])

  const handleSchedule = async () => {
    if (!selectedClientId || !counselorId || !scheduledAt) {
      setError('Please select a client and time.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/admin/schedule-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClientId,
        counselor_id: counselorId,
        scheduled_at: useSlots ? scheduledAt : new Date(scheduledAt).toISOString(),
        type: sessionType,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : undefined,
        recurrence_end_date: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
      }),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to schedule session')
      return
    }

    setSuccess(`Successfully scheduled ${json.created} session${json.created > 1 ? 's' : ''}!`)
    setScheduledAt('')
    setSelectedClientId(null)
    setClientSearch('')
    setIsRecurring(false)
  }

  const filteredClients = clients.filter(c => {
    if (!clientSearch.trim()) return true
    const q = clientSearch.toLowerCase()
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const groupedSlots = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const key = format(new Date(slot.start), 'EEE, MMM d')
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <CounselorNav />
      <p style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--nhlb-cream)' }}>
      <CounselorNav />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem',
          fontWeight: 600, color: 'var(--nhlb-red-dark)', margin: '0 0 8px',
        }}>
          Schedule a Session
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.875rem', marginBottom: 28 }}>
          Schedule a session for one of your assigned clients.
        </p>

        {error && (
          <div style={{
            marginBottom: 16, padding: '12px 14px', backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 8,
            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#B91C1C',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            marginBottom: 16, padding: '12px 14px', backgroundColor: '#EAF5EE',
            border: '1px solid #A7F3D0', borderRadius: 8,
            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: '#065F46',
          }}>{success}</div>
        )}

        <div style={{
          background: 'white', border: '1px solid var(--nhlb-border)',
          borderRadius: 12, padding: '24px', marginBottom: 16,
        }}>
          {/* Client */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Client *</label>
            {selectedClient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--nhlb-border)', borderRadius: 8, background: 'var(--nhlb-cream)' }}>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 600 }}>
                  {selectedClient.first_name} {selectedClient.last_name}
                </span>
                <button onClick={() => { setSelectedClientId(null); setClientSearch('') }} style={{
                  background: 'none', border: 'none', color: 'var(--nhlb-red)', cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 700,
                }}>Change</button>
              </div>
            ) : (
              <>
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  placeholder="Search your clients..." style={S.input} />
                {clientSearch.trim() && (
                  <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 4, border: '1px solid var(--nhlb-border)', borderRadius: 8, background: 'white' }}>
                    {filteredClients.length === 0 ? (
                      <p style={{ padding: '12px 14px', fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', color: 'var(--nhlb-muted)', margin: 0 }}>
                        No clients found
                      </p>
                    ) : (
                      filteredClients.slice(0, 20).map(c => (
                        <button key={c.id} onClick={() => { setSelectedClientId(c.id); setClientSearch('') }} style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          border: 'none', borderBottom: '1px solid var(--nhlb-border)',
                          background: 'white', cursor: 'pointer',
                          fontFamily: 'Lato, sans-serif', fontSize: '0.85rem',
                        }}>
                          <strong>{c.first_name} {c.last_name}</strong>
                          <span style={{ color: 'var(--nhlb-muted)', marginLeft: 8 }}>{c.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Session type */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Session Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { v: 'IN_PERSON' as const, emoji: '🏠', label: 'In Person' },
                { v: 'VIRTUAL' as const, emoji: '💻', label: 'Virtual' },
              ]).map(({ v, emoji, label }) => (
                <button key={v} onClick={() => setSessionType(v)} style={{
                  padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${sessionType === v ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                  backgroundColor: sessionType === v ? 'var(--nhlb-red)' : 'white',
                  color: sessionType === v ? 'white' : 'var(--nhlb-text)',
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: 4 }}>{emoji}</span>
                  <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Date &amp; Time *</label>
              <button onClick={() => setUseSlots(!useSlots)} style={{
                background: 'none', border: 'none', color: 'var(--nhlb-red)',
                fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}>
                {useSlots ? 'Enter custom time →' : '← Pick from slots'}
              </button>
            </div>
            {useSlots ? (
              loadingSlots ? (
                <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.85rem' }}>Loading slots...</p>
              ) : Object.keys(groupedSlots).length === 0 ? (
                <p style={{ fontFamily: 'Lato, sans-serif', color: 'var(--nhlb-muted)', fontSize: '0.85rem' }}>
                  No available slots.
                </p>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {Object.entries(groupedSlots).map(([day, daySlots]) => (
                    <div key={day} style={{ marginBottom: 16 }}>
                      <p style={{
                        fontFamily: 'Lato, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--nhlb-muted)', marginBottom: 8,
                      }}>{day}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                        {daySlots.map(slot => {
                          const isSelected = scheduledAt === slot.start
                          return (
                            <button key={slot.start} onClick={() => setScheduledAt(slot.start)} style={{
                              padding: '8px 4px', borderRadius: 6,
                              border: `1px solid ${isSelected ? 'var(--nhlb-red)' : 'var(--nhlb-border)'}`,
                              backgroundColor: isSelected ? 'var(--nhlb-red)' : 'white',
                              color: isSelected ? 'white' : 'var(--nhlb-text)',
                              fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', cursor: 'pointer',
                            }}>
                              {format(new Date(slot.start), 'h:mm a')}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <input type="datetime-local"
                value={scheduledAt ? format(new Date(scheduledAt), "yyyy-MM-dd'T'HH:mm") : scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                style={S.input} />
            )}
            {scheduledAt && (
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: 'var(--nhlb-text)', marginTop: 6 }}>
                Selected: <strong>{format(new Date(scheduledAt), 'EEE, MMM d, yyyy \'at\' h:mm a')}</strong>
              </p>
            )}
          </div>

          {/* Recurring */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
              <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--nhlb-red)' }} />
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 700 }}>Make this a recurring session</span>
            </label>
            {isRecurring && (
              <div style={{
                background: 'var(--nhlb-cream)', border: '1px solid var(--nhlb-border)',
                borderRadius: 8, padding: '16px', marginTop: 8,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={S.label}>Frequency</label>
                    <select value={recurrencePattern} onChange={e => setRecurrencePattern(e.target.value as 'weekly' | 'biweekly' | 'monthly')} style={S.input}>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 Weeks</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>End date</label>
                    <input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} style={S.input} />
                  </div>
                </div>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: 'var(--nhlb-muted)', marginTop: 8, fontStyle: 'italic' }}>
                  Sessions will be created at the same time on each occurrence. Weekends are skipped.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSchedule}
            disabled={submitting || !selectedClientId || !scheduledAt}
            style={{
              ...S.btn('var(--nhlb-red)', 'white'),
              width: '100%',
              opacity: submitting || !selectedClientId || !scheduledAt ? 0.5 : 1,
            }}
          >
            {submitting ? 'Scheduling...' : isRecurring ? 'Schedule Recurring Sessions' : 'Schedule Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
