import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const supabase = createSupabaseAdminClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  let assignedCounselor = null
  if (client.assigned_counselor_id) {
    const { data } = await supabase
      .from('counselors')
      .select('id, name, title, photo_url')
      .eq('id', client.assigned_counselor_id)
      .single()
    assignedCounselor = data
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, counselor:counselors(id, name, title)')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false })

  const { data: intakes } = await supabase
    .from('hipaa_intakes')
    .select('id, completed_at, form_data, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)

  const intake = intakes?.[0] ?? null

  return NextResponse.json({
    client,
    assignedCounselor,
    bookings: bookings ?? [],
    hipaaCompleted: intake?.completed_at != null,
    hipaaIntake: intake,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const updates: Record<string, unknown> = {}
  const fields = ['first_name', 'last_name', 'email', 'phone', 'service_type', 'brief_reason', 'assigned_counselor_id']
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.assigned_counselor_id !== undefined) {
    const newCounselorId = body.assigned_counselor_id || null
    if (newCounselorId) {
      await supabase
        .from('bookings')
        .update({ counselor_id: newCounselorId })
        .eq('client_id', clientId)
        .eq('status', 'CONFIRMED')
        .gte('scheduled_at', new Date().toISOString())
    }
  }

  return NextResponse.json({ client: data })
}
