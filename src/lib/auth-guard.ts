import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export interface AuthResult {
  user: { id: string; email: string }
}

export interface CounselorAuthResult extends AuthResult {
  counselorId: string
}

export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user: { id: user.id, email: user.email } }
}

export async function requireCounselor(): Promise<CounselorAuthResult | NextResponse> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!counselor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { user: { id: user.id, email: user.email ?? '' }, counselorId: counselor.id }
}

export async function requireAdminOrCounselor(): Promise<(AuthResult & { role: 'admin' | 'counselor'; counselorId?: string }) | NextResponse> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return { user: { id: user.id, email: user.email }, role: 'admin' }
  }

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (counselor) {
    return { user: { id: user.id, email: user.email }, role: 'counselor', counselorId: counselor.id }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse
}
