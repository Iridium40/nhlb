import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  
  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  
  const { data: counselor, error } = await supabase
    .from('counselors')
    .select('id, name, title, bio, photo_url, specialties, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !counselor) {
    return NextResponse.json({ error: 'Counselor not found' }, { status: 404 })
  }

  return NextResponse.json({ counselor })
}
