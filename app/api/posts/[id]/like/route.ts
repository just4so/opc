import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { createPostLikedNotification } from '@/lib/notifications'

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

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.favorite.delete({
          where: { id: existing.id },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({ liked: false, message: '已取消点赞' })
    } else {
      await prisma.$transaction([
        prisma.favorite.create({
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

      const likerName = session.user.name || '有人'
      createPostLikedNotification(post.authorId, likerName, postId, userId).catch(() => {})

      return NextResponse.json({ liked: true, message: '点赞成功' })
    }
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

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

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    return NextResponse.json({ liked: !!favorite })
  } catch (error) {
    return NextResponse.json({ liked: false })
  }
}
