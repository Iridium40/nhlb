import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  const { data: counselor, error } = await admin
    .from('counselors')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single()

  if (error || !counselor) {
    return NextResponse.json({ error: 'No counselor profile linked to this account' }, { status: 403 })
  }

  return NextResponse.json({ counselor, userId: user.id })
}
