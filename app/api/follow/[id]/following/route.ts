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

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        createdAt: true,
        following: {
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
    prisma.follow.count({ where: { followerId: userId } }),
  ])

  return NextResponse.json({
    users: following.map(f => ({
      ...f.following,
      followedAt: f.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
