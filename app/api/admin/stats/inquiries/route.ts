import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireStaff } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireStaff()

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayCount, statusCounts, topCommunities] = await Promise.all([
      prisma.inquiry.count({
        where: { createdAt: { gte: todayStart } },
      }),

      prisma.inquiry.groupBy({
        by: ['status'],
        _count: true,
      }),

      prisma.inquiry.groupBy({
        by: ['communityName'],
        where: { communityName: { not: null } },
        _count: true,
        orderBy: { _count: { communityName: 'desc' } },
        take: 5,
      }),
    ])

    const statusMap: Record<string, number> = {}
    for (const s of statusCounts) {
      statusMap[s.status] = s._count
    }

    const topCommunitiesList = topCommunities.map(c => ({
      name: c.communityName,
      count: c._count,
    }))

    return NextResponse.json({
      todayCount,
      statusMap,
      topCommunities: topCommunitiesList,
    })
  } catch (error) {
    console.error('获取意向统计数据失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
