import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest|icons|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must not run awaited Supabase calls between createServerClient and getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicRoutes = ['/login', '/auth/callback']
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r))

  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    if (pathname === '/login') {
      const nextParam = request.nextUrl.searchParams.get('next')
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.search = ''
      redirectUrl.pathname =
        nextParam && nextParam.startsWith('/') ? nextParam : '/'
      return NextResponse.redirect(redirectUrl)
    }

    const isOnboarding = pathname.startsWith('/onboarding')
    if (!isOnboarding) {
      const { data: profile } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single()

      if (!profile?.nickname) {
        const onboardingUrl = request.nextUrl.clone()
        onboardingUrl.pathname = '/onboarding/profile'
        return NextResponse.redirect(onboardingUrl)
      }
    }
  }

  return supabaseResponse
}

