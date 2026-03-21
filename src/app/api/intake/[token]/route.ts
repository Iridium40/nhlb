import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('hipaa_intakes')
    .select('id, client_id, token, completed_at, form_data, created_at')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
  }

  // Also fetch client name for display
  const { data: client } = await supabase
    .from('clients')
    .select('first_name, last_name')
    .eq('id', data.client_id)
    .single()

  return NextResponse.json({
    intake: data,
    clientName: client ? `${client.first_name} ${client.last_name}` : null,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await req.json()
  const supabase = createSupabaseAdminClient()

  const { data: existing } = await supabase
    .from('hipaa_intakes')
    .select('id, completed_at')
    .eq('token', token)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
  }

  if (existing.completed_at) {
    return NextResponse.json({ error: 'This intake form has already been submitted' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hipaa_intakes')
    .update({
      form_data: body.formData,
      completed_at: new Date().toISOString(),
    })
    .eq('token', token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submitted: true })
}
