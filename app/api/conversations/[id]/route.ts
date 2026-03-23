import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// 获取对话详情和消息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id
    const conversationId = params.id

    // 验证用户是否是对话参与者
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: '无权访问此对话' }, { status: 403 })
    }

    // 获取对话和消息
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 })
    }

    // 标记消息为已读
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    })

    const otherUser = conversation.participants.find(
      (p) => p.userId !== userId
    )?.user

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
        messages: conversation.messages,
      },
    })
  } catch (error) {
    console.error('获取对话详情失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
