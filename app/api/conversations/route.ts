import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// 获取当前用户的所有对话
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // 格式化返回数据
    const result = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== userId
      )
      const myParticipant = conv.participants.find(
        (p) => p.userId === userId
      )

      return {
        id: conv.id,
        otherUser: otherParticipant?.user,
        lastMessage: conv.messages[0] || null,
        unreadCount: myParticipant?.unreadCount || 0,
        updatedAt: conv.updatedAt,
      }
    })

    return NextResponse.json({ conversations: result })
  } catch (error) {
    console.error('获取对话列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// 创建新对话或获取已存在的对话
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id
    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: '缺少目标用户' }, { status: 400 })
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: '不能给自己发私信' }, { status: 400 })
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 查找是否已有对话
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          where: { userId: { not: userId } },
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (existingConversation) {
      return NextResponse.json({
        conversation: {
          id: existingConversation.id,
          otherUser: existingConversation.participants[0]?.user,
        },
        isNew: false,
      })
    }

    // 创建新对话
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        participants: {
          where: { userId: targetUserId },
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      conversation: {
        id: newConversation.id,
        otherUser: newConversation.participants[0]?.user,
      },
      isNew: true,
    })
  } catch (error) {
    console.error('创建对话失败:', error)
    const message = error instanceof Error ? error.message : '创建失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
