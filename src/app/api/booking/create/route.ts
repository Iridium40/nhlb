import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendBookingConfirmation, sendCounselorNotification, sendHipaaIntakeEmail } from '@/lib/email'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone number is required'),
  service_type: z.string().default('individual'),
  brief_reason: z.string().optional(),
  counselor_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  type: z.enum(['IN_PERSON', 'VIRTUAL']).default('IN_PERSON'),
  donation_amount_cents: z.number().min(0).default(0),
  stripe_payment_id: z.string().optional(),
  client_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const supabase = createSupabaseAdminClient()

    // Reuse existing client or create new
    let clientId = data.client_id
    let client
    if (clientId) {
      const { data: existing } = await supabase.from('clients').select().eq('id', clientId).single()
      client = existing
    }
    if (!client) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          service_type: data.service_type,
          brief_reason: data.brief_reason ?? null,
        })
        .select()
        .single()
      if (clientError) throw clientError
      client = newClient
      clientId = newClient.id
    }

    // Double-check slot availability
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('counselor_id', data.counselor_id)
      .eq('scheduled_at', data.scheduled_at)
      .neq('status', 'CANCELLED')

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'That time slot is no longer available.' },
        { status: 409 }
      )
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: clientId,
        counselor_id: data.counselor_id,
        scheduled_at: data.scheduled_at,
        type: data.type,
        status: 'CONFIRMED',
        donation_amount_cents: data.donation_amount_cents,
        stripe_payment_id: data.stripe_payment_id ?? null,
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Assign counselor to client if not already assigned
    if (client && !client.assigned_counselor_id) {
      await supabase
        .from('clients')
        .update({ assigned_counselor_id: data.counselor_id })
        .eq('id', clientId)
    }

    // Record love offering in donations table for financial reporting
    if (data.donation_amount_cents > 0) {
      await supabase.from('donations').insert({
        booking_id: booking.id,
        client_id: clientId,
        amount_cents: data.donation_amount_cents,
        fund: 'COUNSELING',
        donor_name: `${data.first_name} ${data.last_name}`,
        donor_email: data.email,
        stripe_payment_intent_id: data.stripe_payment_id ?? null,
        stripe_status: data.stripe_payment_id ? 'pending' : 'dev_mode',
        is_anonymous: false,
      }).then(({ error: donErr }) => {
        if (donErr) console.error('[booking/create] donation insert error:', donErr.message)
      })
    }

    // Fetch counselor for emails
    const { data: counselor } = await supabase
      .from('counselors')
      .select()
      .eq('id', data.counselor_id)
      .single()

    if (counselor && client) {
      await Promise.allSettled([
        sendBookingConfirmation({ booking, counselor, client }),
        sendCounselorNotification({ booking, counselor, client }),
      ])
    }

    // Create HIPAA intake record + send email for new clients
    if (!data.client_id && client) {
      const intakeToken = crypto.randomUUID()
      await supabase.from('hipaa_intakes').insert({
        client_id: clientId,
        token: intakeToken,
      })
      const baseUrl = req.headers.get('origin') ?? req.headers.get('host') ?? ''
      const protocol = baseUrl.startsWith('http') ? '' : 'https://'
      const intakeUrl = `${protocol}${baseUrl}/intake/${intakeToken}`
      await sendHipaaIntakeEmail({ client, intakeUrl }).catch(console.error)
    }

    return NextResponse.json({ bookingId: booking.id, clientId })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error('[/api/booking/create]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
