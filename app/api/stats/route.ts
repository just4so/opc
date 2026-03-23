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

    // 城市平均入驻难度
    const difficultyData = await prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE', applyDifficulty: { not: null } },
      _avg: { applyDifficulty: true },
      _count: { applyDifficulty: true },
    })

    const cityDifficulty = difficultyData
      .filter((d) => d._avg.applyDifficulty !== null)
      .map((d) => ({
        city: d.city,
        difficulty: Math.round(d._avg.applyDifficulty! * 10) / 10,
        count: d._count.applyDifficulty,
      }))
      .sort((a, b) => b.difficulty - a.difficulty)

    // 计算汇总
    const totalCommunities = cities.reduce((sum, c) => sum + c.count, 0)
    const totalCities = cities.length

    return NextResponse.json({
      totalCommunities,
      totalCities,
      cityCounts: cities,
      cityDifficulty,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
