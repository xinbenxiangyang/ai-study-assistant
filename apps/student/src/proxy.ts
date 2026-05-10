import { NextResponse, type NextRequest } from 'next/server'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export async function proxy(request: NextRequest) {
  if (DEV_MODE) return NextResponse.next({ request })

  try {
    const { createServerClient } = await import('@supabase/ssr')
    let response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
          setAll: (cookies) => cookies.forEach(({ name, value, ...opts }) =>
            response.cookies.set({ name, value, ...opts })),
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    if (user && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (!user && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  } catch {
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
