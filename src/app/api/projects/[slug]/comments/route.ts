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
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
    }

    // 获取项目
    const project = await prisma.project.findUnique({
      where: { slug },
    })

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    // 创建评论并更新评论数
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: content.trim(),
          projectId: project.id,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.project.update({
        where: { id: project.id },
        data: { commentCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comment error:', error)
    return NextResponse.json({ error: '评论失败' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const project = await prisma.project.findUnique({
      where: { slug },
    })

    if (!project) {
      return NextResponse.json([])
    }

    const comments = await prisma.comment.findMany({
      where: { projectId: project.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 })
  }
}
