import { NextResponse } from 'next/server'
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
    .select('id')
    .eq('supabase_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('*, counselor:counselors(id, name, title, photo_url, zoom_link, zoom_meeting_id, zoom_passcode)')
    .eq('client_id', client.id)
    .order('scheduled_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: bookings ?? [] })
}
