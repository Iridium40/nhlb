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

  let assignedCounselor = null
  if (client.assigned_counselor_id) {
    const { data } = await admin
      .from('counselors')
      .select('id, name, title, zoom_link, photo_url')
      .eq('id', client.assigned_counselor_id)
      .single()
    assignedCounselor = data
  }

  return NextResponse.json({
    client,
    assignedCounselor,
  })
}
