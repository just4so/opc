import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireStaff()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)

    const [todayInquiries, pendingClaims, pendingVerifications, weeklyNewUsers] =
      await Promise.all([
        prisma.inquiry.count({ where: { createdAt: { gte: today } } }),
        prisma.communityClaim.count({ where: { status: 'PENDING' } }),
        prisma.user.count({ where: { showInPlaza: true, verified: false } }),
        prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      ])

    return NextResponse.json({
      todayInquiries,
      pendingClaims,
      pendingVerifications,
      weeklyNewUsers,
    })
  } catch (error) {
    console.error('获取后台仪表盘数据失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
