import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id: userId } = await context.params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        createdAt: true,
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            mainTrack: true,
            mainTracks: true,
            verified: true,
          },
        },
      },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ])

  return NextResponse.json({
    users: followers.map(f => ({
      ...f.follower,
      followedAt: f.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
