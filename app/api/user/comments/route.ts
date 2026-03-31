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

  const where = { authorId: session.user.id }

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        post: {
          select: { id: true, content: true, title: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    data: comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    total,
    page,
    hasMore: skip + comments.length < total,
  })
}
