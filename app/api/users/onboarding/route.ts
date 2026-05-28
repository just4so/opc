import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const track = req.nextUrl.searchParams.get('track')
  const location = req.nextUrl.searchParams.get('location')

  const where: Record<string, unknown> = {
    id: { not: session.user.id },
    showInPlaza: true,
  }

  const userSelect = {
    id: true,
    username: true,
    name: true,
    avatar: true,
    bio: true,
    mainTrack: true,
    location: true,
  } as const

  type RecommendedUser = {
    id: string
    username: string
    name: string | null
    avatar: string | null
    bio: string | null
    mainTrack: string | null
    location: string | null
  }

  let users: RecommendedUser[] = []

  if (track) {
    users = await prisma.user.findMany({
      where: { ...where, mainTrack: { contains: track, mode: 'insensitive' } },
      take: 5,
      orderBy: { lastActiveAt: 'desc' },
      select: userSelect,
    })
  }

  if (users.length < 3 && location) {
    const existingIds = users.map(u => u.id)
    const locationUsers = await prisma.user.findMany({
      where: {
        ...where,
        id: { notIn: [session.user.id, ...existingIds] },
        location: { contains: location, mode: 'insensitive' },
      },
      take: 5 - users.length,
      orderBy: { lastActiveAt: 'desc' },
      select: userSelect,
    })
    users = [...users, ...locationUsers]
  }

  if (users.length < 3) {
    const existingIds = users.map(u => u.id)
    const fallbackUsers = await prisma.user.findMany({
      where: {
        ...where,
        id: { notIn: [session.user.id, ...existingIds] },
      },
      take: 5 - users.length,
      orderBy: [{ verified: 'desc' }, { lastActiveAt: 'desc' }],
      select: userSelect,
    })
    users = [...users, ...fallbackUsers]
  }

  return NextResponse.json({ users })
}

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  })

  return NextResponse.json({ success: true })
}
