import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase'
import { differenceInHours } from 'date-fns'

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
  return NextResponse.json({ booking: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const body = await req.json()
  const admin = createSupabaseAdminClient()

  // Determine caller role
  const caller = body._caller as string | undefined // 'client' | 'counselor' | undefined (admin)

  // For client-initiated cancellations, enforce the 24hr rule
  if (body.status === 'CANCELLED' && caller === 'client') {
    const { data: booking } = await admin
      .from('bookings')
      .select('scheduled_at, client:clients(email)')
      .eq('id', bookingId)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const clientData = booking.client as unknown as { email: string } | null
    if (body._email && clientData?.email?.toLowerCase() !== body._email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match this booking' }, { status: 403 })
    }

    const hoursUntil = differenceInHours(new Date(booking.scheduled_at), new Date())
    if (hoursUntil < 24) {
      return NextResponse.json({
        error: 'Cancellations within 24 hours of the appointment must be made by phone. Please call 985-264-8808.',
        within24hrs: true,
      }, { status: 400 })
    }
  }

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.notes !== undefined) updates.notes = body.notes

  const { data, error } = await admin
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select('*, client:clients(*), counselor:counselors(id, name, title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booking: data })
}
