import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { slug } = await params
    const userId = session.user.id

    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    })

    if (!project) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 })
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: '只有产品创建者可以记录进展' }, { status: 403 })
    }

    const body = await request.json()
    const { content, milestone } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const progress = await prisma.progress.create({
      data: {
        content: content.trim(),
        milestone: milestone?.trim() || null,
        authorId: userId,
        projectId: project.id,
      },
    })

    // 通知所有点赞该产品的用户（排除作者自己）
    try {
      const likers = await prisma.favorite.findMany({
        where: {
          projectId: project.id,
          userId: { not: userId },
        },
        select: { userId: true },
      })

      if (likers.length > 0) {
        const projectInfo = await prisma.project.findUnique({
          where: { id: project.id },
          select: { name: true },
        })
        const projectName = projectInfo?.name ?? '你关注的产品'

        await prisma.notification.createMany({
          data: likers.map(({ userId: likerId }) => ({
            userId: likerId,
            type: 'PROJECT_PROGRESS',
            title: `你点赞的产品「${projectName}」发布了新进展`,
            content: progress.content.slice(0, 100),
            relatedId: slug,
          })),
          skipDuplicates: true,
        })
      }
    } catch (err) {
      console.error('Progress notification error:', err)
    }

    return NextResponse.json({
      progress: {
        id: progress.id,
        content: progress.content,
        milestone: progress.milestone,
        createdAt: progress.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Progress create error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 })
    }

    const [items, total] = await Promise.all([
      prisma.progress.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          milestone: true,
          createdAt: true,
        },
      }),
      prisma.progress.count({ where: { projectId: project.id } }),
    ])

    return NextResponse.json({
      items: items.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Progress list error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
