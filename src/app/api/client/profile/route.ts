import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, first_name, last_name, email, phone')
    .eq('supabase_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json({ client })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, email')
    .eq('supabase_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const body = await req.json()
  const updates: Record<string, string> = {}

  if (body.email && body.email !== client.email) {
    updates.email = body.email
    const { error: authErr } = await admin.auth.admin.updateUserById(user.id, { email: body.email })
    if (authErr) {
      return NextResponse.json({ error: `Could not update email: ${authErr.message}` }, { status: 400 })
    }
  }

  if (body.phone !== undefined) {
    updates.phone = body.phone
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ client })
  }

  const { data: updated, error } = await admin
    .from('clients')
    .update(updates)
    .eq('id', client.id)
    .select('id, first_name, last_name, email, phone')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ client: updated })
}
