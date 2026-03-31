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

  const [total, likes] = await Promise.all([
    prisma.like.count({ where }),
    prisma.like.findMany({
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
    data: likes.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      post: l.post ? { ...l.post, createdAt: l.post.createdAt.toISOString() } : null,
    })),
    total,
    page,
    hasMore: skip + likes.length < total,
  })
}
