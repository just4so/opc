import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id: postId } = await params
    const userId = session.user.id

    // 检查帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existingLike) {
      // 取消点赞
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.post.update({
          where: { id: postId },
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
            postId,
          },
        }),
        prisma.post.update({
          where: { id: postId },
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

// 获取当前用户是否已点赞
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ liked: false })
    }

    const { id: postId } = await params
    const userId = session.user.id

    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    return NextResponse.json({ liked: false })
  }
}
