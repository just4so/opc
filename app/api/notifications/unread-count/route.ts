import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('获取未读通知数失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
