import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: 0, messages: 0 })
    }

    const [notificationCount, messageResult] = await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
      prisma.conversationParticipant.aggregate({
        where: { userId: session.user.id },
        _sum: { unreadCount: true },
      }),
    ])

    return NextResponse.json({
      notifications: notificationCount,
      messages: messageResult._sum.unreadCount || 0,
    })
  } catch {
    return NextResponse.json({ notifications: 0, messages: 0 })
  }
}
