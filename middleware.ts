import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

async function maybeRedirectCommunitySlug(_request: NextRequest, _pathname: string) {
  // newSlug 字段已删除，所有社区 slug 统一为英文，无需重定向
  return null
}

function isLoggedIn(request: NextRequest): boolean {
  const isSecure = request.url.startsWith('https://')
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'
  const sessionCookie = request.cookies.get(cookieName)
  return !!sessionCookie?.value
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const communityRedirect = await maybeRedirectCommunitySlug(request, pathname)
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
