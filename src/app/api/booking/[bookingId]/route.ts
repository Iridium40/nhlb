import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase'
import { differenceInHours } from 'date-fns'
import { STATUS_TRANSITIONS } from '@/types'
import { decryptPHI } from '@/lib/phi-crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('bookings')
    .select('*, client:clients(*), counselor:counselors(*)')
    .eq('id', bookingId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  if (data.client) {
    try {
      data.client.brief_reason = decryptPHI(data.client.brief_reason)
    } catch {
      // Value may be plain text from before encryption was enabled
    }
  }

  return NextResponse.json({ booking: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const body = await req.json()
  const admin = createSupabaseAdminClient()

  const { data: current } = await admin
    .from('bookings')
    .select('*, client:clients(email)')
    .eq('id', bookingId)
    .single()

  if (!current) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const caller = body._caller as string | undefined

  // Client-initiated cancellation: enforce 24hr rule
  if (body.status === 'cancelled' && caller === 'client') {
    const clientData = current.client as unknown as { email: string } | null
    if (body._email && clientData?.email?.toLowerCase() !== body._email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match this booking' }, { status: 403 })
    }

    const hoursUntil = differenceInHours(new Date(current.scheduled_at), new Date())
    if (hoursUntil < 24) {
      return NextResponse.json({
        error: 'Cancellations within 24 hours of the appointment must be made by phone. Please call 985-264-8808.',
        within24hrs: true,
      }, { status: 400 })
    }
  }

  // Status transition validation
  if (body.status !== undefined && body.status !== current.status) {
    const allowed = STATUS_TRANSITIONS[current.status] ?? []
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from "${current.status}" to "${body.status}". Allowed: ${allowed.join(', ') || 'none'}` },
        { status: 400 }
      )
    }
  }

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.pre_call_notes !== undefined) updates.pre_call_notes = body.pre_call_notes
  if (body.session_notes !== undefined) updates.session_notes = body.session_notes
  if (body.call_completed_by !== undefined) updates.call_completed_by = body.call_completed_by
  if (body.meeting_link !== undefined) updates.meeting_link = body.meeting_link
  if (body.meeting_id !== undefined) updates.meeting_id = body.meeting_id
  if (body.meeting_passcode !== undefined) updates.meeting_passcode = body.meeting_passcode

  // Cannot start or complete a session if the scheduled date is in the future
  if (body.status === 'in_session' || body.status === 'completed') {
    const scheduledDate = new Date(current.scheduled_at)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const schedDay = new Date(scheduledDate)
    schedDay.setHours(0, 0, 0, 0)
    if (schedDay > today) {
      return NextResponse.json(
        { error: `Cannot ${body.status === 'in_session' ? 'start' : 'complete'} a session scheduled for a future date.` },
        { status: 400 }
      )
    }
  }

  // Auto-stamp call_completed_at when transitioning to call_complete
  if (body.status === 'call_complete') {
    updates.call_completed_at = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select('*, client:clients(*), counselor:counselors(id, name, title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booking: data })
}
