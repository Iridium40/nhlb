import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ client: null })
  }

  const admin = createSupabaseAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ client: null })
  }

  const { data: lastBooking } = await admin
    .from('bookings')
    .select('counselor_id, counselor:counselors(id, name, title, zoom_link, photo_url)')
    .eq('client_id', client.id)
    .eq('status', 'COMPLETED')
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    client,
    lastCounselor: lastBooking?.counselor ?? null,
  })
}
