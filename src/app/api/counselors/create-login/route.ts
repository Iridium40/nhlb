import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { counselorId, email, password } = await req.json()

  if (!counselorId || !email || !password) {
    return NextResponse.json({ error: 'counselorId, email, and password are required' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const { data: counselor, error: fetchErr } = await supabase
    .from('counselors')
    .select('id, name, supabase_user_id')
    .eq('id', counselorId)
    .single()

  if (fetchErr || !counselor) {
    return NextResponse.json({ error: 'Counselor not found' }, { status: 404 })
  }

  if (counselor.supabase_user_id) {
    return NextResponse.json({ error: 'This counselor already has a login account' }, { status: 409 })
  }

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'counselor', counselor_id: counselorId, name: counselor.name },
  })

  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  const { error: linkErr } = await supabase
    .from('counselors')
    .update({ supabase_user_id: authData.user.id, email })
    .eq('id', counselorId)

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}
