import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 需要登录才能访问的路由前缀
const PROTECTED_PATHS = [
  '/plaza/new',
  '/market/new',
  '/profile',
  '/messages',
  '/settings',
]

async function maybeRedirectCommunitySlug(request: NextRequest, pathname: string) {
  const match = pathname.match(/^\/communities\/([^/]+)$/)
  if (!match) return null

  const rawSlug = match[1]
  let decodedSlug = rawSlug
  try {
    decodedSlug = decodeURIComponent(rawSlug)
  } catch {
    // keep rawSlug
  }

  if (!/[\u4e00-\u9fff]/.test(decodedSlug)) return null

  const apiUrl = new URL('/api/communities/slug-redirect', request.url)
  apiUrl.searchParams.set('old', decodedSlug)

  const res = await fetch(apiUrl.toString(), { cache: 'no-store' })
  if (!res.ok) return null

  const data = (await res.json()) as { newSlug?: string | null }
  if (!data.newSlug) return null

  return NextResponse.redirect(new URL(`/communities/${encodeURIComponent(data.newSlug)}`, request.url), 301)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const communityRedirect = await maybeRedirectCommunitySlug(request, pathname)
  if (communityRedirect) return communityRedirect

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  const session = await auth()
  if (!session) {
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
