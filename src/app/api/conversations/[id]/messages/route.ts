import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// 发送消息
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const conversationId = params.id
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 })
    }

    // 验证用户是否是对话参与者
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: '无权发送消息' }, { status: 403 })
    }

    // 创建消息并更新对话
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
    })

    // 更新对话时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // 更新其他参与者的未读数
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: session.user.id },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('发送消息失败:', error)
    return NextResponse.json({ error: '发送失败' }, { status: 500 })
  }
}
