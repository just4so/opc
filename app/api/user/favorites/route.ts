import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(PAGE_SIZE, parseInt(searchParams.get('limit') || String(PAGE_SIZE)))
  const skip = (page - 1) * limit

  const where = { userId: session.user.id, postId: { not: null } }

  const [total, favorites] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            likeCount: true,
            commentCount: true,
            createdAt: true,
            author: {
              select: { id: true, username: true, name: true, avatar: true, level: true, verified: true },
            },
          },
        },
      },
    }),
  ])

  return NextResponse.json({
    data: favorites.map(f => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      post: f.post ? { ...f.post, createdAt: f.post.createdAt.toISOString() } : null,
    })),
    total,
    page,
    hasMore: skip + favorites.length < total,
  })
}
