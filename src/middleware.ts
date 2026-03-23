import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ADMIN_PATHS = ['/admin/login']
const PUBLIC_COUNSELOR_PATHS = ['/counselor/login', '/counselor/forgot-password']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isCounselorRoute = pathname.startsWith('/counselor')

  if (!isAdminRoute && !isCounselorRoute) return NextResponse.next()

  if (PUBLIC_ADMIN_PATHS.some(p => pathname === p)) return NextResponse.next()
  if (PUBLIC_COUNSELOR_PATHS.some(p => pathname === p)) return NextResponse.next()

  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = isAdminRoute ? '/admin/login' : '/counselor/login'
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/counselor/:path*'],
}
