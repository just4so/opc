import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { ids, all } = body as { ids?: string[]; all?: boolean }

    let result
    if (all) {
      result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
    } else if (ids && ids.length > 0) {
      result = await prisma.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { isRead: true },
      })
    } else {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('标记通知已读失败:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
