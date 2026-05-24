import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const { pathname } = request.nextUrl
  const isAccountRoute = pathname.startsWith('/account')
  const isAdminRoute = pathname.startsWith('/admin')

  if (!isAccountRoute && !isAdminRoute) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  if (isAdminRoute) {
    // Single-admin store: only the env ADMIN_EMAIL ("CEO") may enter /admin.
    const ceo = process.env.ADMIN_EMAIL?.toLowerCase().trim() || null
    const isCeo = !!user.email && !!ceo && user.email.toLowerCase() === ceo

    if (!isCeo) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
