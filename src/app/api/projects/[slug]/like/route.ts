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

    // 获取项目
    const project = await prisma.project.findUnique({
      where: { slug },
    })

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 })
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: project.id,
        },
      },
    })

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.project.update({
          where: { id: project.id },
          data: { likeCount: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({ liked: false, message: '已取消点赞' })
    } else {
      // 点赞
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            projectId: project.id,
          },
        }),
        prisma.project.update({
          where: { id: project.id },
          data: { likeCount: { increment: 1 } },
        }),
      ])

      return NextResponse.json({ liked: true, message: '点赞成功' })
    }
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ liked: false })
    }

    const { slug } = await params
    const userId = session.user.id

    const project = await prisma.project.findUnique({
      where: { slug },
    })

    if (!project) {
      return NextResponse.json({ liked: false })
    }

    const like = await prisma.like.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: project.id,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    return NextResponse.json({ liked: false })
  }
}
