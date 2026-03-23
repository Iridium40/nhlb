import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

async function getCounselor() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createSupabaseAdminClient()
  const { data: counselor } = await admin
    .from('counselors')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  return counselor
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const counselor = await getCounselor()
  if (!counselor) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { clientId } = await params
  const admin = createSupabaseAdminClient()

  const { data: client, error } = await admin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('assigned_counselor_id', counselor.id)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: 'Client not found or not assigned to you' }, { status: 404 })
  }

  const { data: bookings } = await admin
    .from('bookings')
    .select('*')
    .eq('client_id', clientId)
    .eq('counselor_id', counselor.id)
    .order('scheduled_at', { ascending: false })

  const bookingIds = (bookings ?? []).map(b => b.id)
  let notes: Record<string, unknown>[] = []

  if (bookingIds.length > 0) {
    const { data } = await admin
      .from('session_notes')
      .select('*')
      .in('booking_id', bookingIds)
      .eq('counselor_id', counselor.id)
      .order('created_at', { ascending: false })
    notes = data ?? []
  }

  const { data: intakes } = await admin
    .from('hipaa_intakes')
    .select('id, completed_at, form_data, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)

  const intake = intakes?.[0] ?? null

  return NextResponse.json({
    client,
    bookings: bookings ?? [],
    notes,
    hipaaCompleted: intake?.completed_at != null,
    hipaaIntake: intake,
  })
}
