import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slug = decodeURIComponent(params.id)

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json({ error: '社区不存在' }, { status: 404 })
    }

    const reviews = await prisma.communityReview.findMany({
      where: { communityId: community.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const avgDifficulty =
      reviews.filter((r) => r.difficulty != null).length > 0
        ? reviews
            .filter((r) => r.difficulty != null)
            .reduce((sum, r) => sum + (r.difficulty ?? 0), 0) /
          reviews.filter((r) => r.difficulty != null).length
        : null

    return NextResponse.json({
      reviews,
      total: reviews.length,
      avgDifficulty,
    })
  } catch (error) {
    console.error('获取社区评价失败:', error)
    return NextResponse.json({ error: '获取评价失败' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const slug = decodeURIComponent(params.id)

    const community = await prisma.community.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json({ error: '社区不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { content, difficulty } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '评价内容不能为空' }, { status: 400 })
    }

    if (content.trim().length > 200) {
      return NextResponse.json({ error: '评价内容不能超过200字' }, { status: 400 })
    }

    if (difficulty != null && (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 5)) {
      return NextResponse.json({ error: '难度评分需为1-5' }, { status: 400 })
    }

    // 检查是否已评价过
    const existing = await prisma.communityReview.findUnique({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: '你已经评价过该社区' }, { status: 409 })
    }

    const review = await prisma.communityReview.create({
      data: {
        communityId: community.id,
        userId: session.user.id,
        content: content.trim(),
        difficulty: difficulty ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('提交社区评价失败:', error)
    return NextResponse.json({ error: '提交评价失败' }, { status: 500 })
  }
}
