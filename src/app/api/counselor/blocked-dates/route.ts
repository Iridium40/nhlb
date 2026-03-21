import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!counselor) return NextResponse.json({ error: 'No counselor profile' }, { status: 403 })

  const { data, error } = await admin
    .from('counselor_blocked_dates')
    .select('*')
    .eq('counselor_id', counselor.id)
    .gte('blocked_date', new Date().toISOString().slice(0, 10))
    .order('blocked_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blockedDates: data, counselorId: counselor.id })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!counselor) return NextResponse.json({ error: 'No counselor profile' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await admin
    .from('counselor_blocked_dates')
    .insert({
      counselor_id: counselor.id,
      blocked_date: body.blocked_date,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      reason: body.reason ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blockedDate: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!counselor) return NextResponse.json({ error: 'No counselor profile' }, { status: 403 })

  const { id } = await req.json()
  const { error } = await admin
    .from('counselor_blocked_dates')
    .delete()
    .eq('id', id)
    .eq('counselor_id', counselor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
