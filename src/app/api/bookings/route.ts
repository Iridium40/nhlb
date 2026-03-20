import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendBookingConfirmation, sendCounselorNotification } from '@/lib/resend'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  service_type: z.enum(['individual', 'marriage', 'family']),
  session_format: z.enum(['in_person', 'virtual']),
  brief_reason: z.string().optional(),
  counselor_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const supabase = createSupabaseAdminClient()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone ?? null,
        service_type: data.service_type,
        brief_reason: data.brief_reason ?? null,
      })
      .select()
      .single()

    if (clientError) throw clientError

    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', data.counselor_id)
      .eq('scheduled_at', data.scheduled_at)
      .neq('status', 'cancelled')

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'That time slot is no longer available. Please choose another.' },
        { status: 409 }
      )
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: client.id,
        counselor_id: data.counselor_id,
        scheduled_at: data.scheduled_at,
        session_format: data.session_format,
        status: 'pending',
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    const { data: counselor } = await supabase
      .from('counselors')
      .select()
      .eq('id', data.counselor_id)
      .single()

    if (counselor) {
      await Promise.allSettled([
        sendBookingConfirmation({ booking, counselor, client }),
        sendCounselorNotification({ booking, counselor, client }),
      ])
    }

    return NextResponse.json({ bookingId: booking.id, clientId: client.id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error('[/api/bookings]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
