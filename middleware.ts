import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import slugMapping from './scripts/slug-mapping.json'

const SLUG_MAPPING = slugMapping as Record<string, string>

const PROTECTED_PATHS = [
  '/plaza/new',
  '/market/new',
  '/messages',
  '/settings',
]

// 精确需要登录的路径（不含子路径）
const PROTECTED_EXACT = [
  '/profile',
]

function maybeRedirectCommunitySlug(request: NextRequest, pathname: string) {
  if (!pathname.startsWith('/communities/')) return null
  const rawSlug = pathname.slice('/communities/'.length)
  if (!rawSlug) return null
  const oldSlug = decodeURIComponent(rawSlug)
  const newSlug = SLUG_MAPPING[oldSlug]
  if (!newSlug) return null
  return NextResponse.redirect(
    new URL(`/communities/${newSlug}`, request.url),
    { status: 301 }
  )
}

function isLoggedIn(request: NextRequest): boolean {
  const isSecure = request.url.startsWith('https://')
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'
  const sessionCookie = request.cookies.get(cookieName)
  return !!sessionCookie?.value
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const communityRedirect = maybeRedirectCommunitySlug(request, pathname)
  if (communityRedirect) return communityRedirect

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
    || PROTECTED_EXACT.some((path) => pathname === path)
  if (!isProtected) return NextResponse.next()

  if (!isLoggedIn(request)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/communities/:path*',
    '/plaza/new',
    '/market/new',
    '/profile/:path*',
    '/messages/:path*',
    '/settings/:path*',
  ],
}
