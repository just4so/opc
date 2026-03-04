import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // 获取各城市社区数量
    const cityCounts = await prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE' },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
    })

    // 转换格式
    const cities = cityCounts.map((c) => ({
      city: c.city,
      count: c._count.city,
    }))

    // 计算汇总
    const totalCommunities = cities.reduce((sum, c) => sum + c.count, 0)
    const totalCities = cities.length

    return NextResponse.json({
      totalCommunities,
      totalCities,
      cityCounts: cities,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
