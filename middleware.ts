import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_ROUTES = ['/dashboard', '/admin']
const ADMIN_ROUTES = ['/admin']
// API routes that do NOT require authentication
const PUBLIC_API_ROUTES = ['/api/auth', '/api/consent', '/api/icons']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // CSP header
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicApi = PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))

  // Only enforce auth on protected page routes and non-public API routes
  if (!isProtected && !(isApiRoute && !isPublicApi)) {
    return response
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin route check
  if (isAdminRoute && token.role !== 'ADMIN' && token.role !== 'MASTER_ADMIN') {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Onboarding redirect: send new users to theme picker on first access
  const isDashboardPage = pathname.startsWith('/dashboard') && !isApiRoute
  const isOnboardingPage = pathname === '/dashboard/bem-vindo'
  if (isDashboardPage && !isOnboardingPage && token.onboardingCompleted === false) {
    return NextResponse.redirect(new URL('/dashboard/bem-vindo', request.url))
  }
  // Prevent onboarding page loop: if already completed, send to dashboard
  if (isOnboardingPage && token.onboardingCompleted === true) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/((?!auth|_next|icons).)*',
  ],
}
