import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

// 获取当前用户的未读消息总数
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const result = await prisma.conversationParticipant.aggregate({
      where: { userId: session.user.id },
      _sum: { unreadCount: true },
    })

    return NextResponse.json({
      unreadCount: result._sum.unreadCount || 0,
    })
  } catch (error) {
    console.error('获取未读数失败:', error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
