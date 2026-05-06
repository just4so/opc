import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const revalidate = 3600 // 1小时缓存

export async function GET() {
  const [cityGroupData, difficultyData] = await Promise.all([
    prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE' },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
    }),
    prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE', entryFriendly: { not: null } },
      _avg: { entryFriendly: true },
      _count: { entryFriendly: true },
    }),
  ])

  const cityCounts = cityGroupData.map((c) => ({
    city: c.city,
    count: c._count.city,
  }))

  const cityDifficulty = difficultyData
    .filter((d) => d._avg.entryFriendly !== null)
    .map((d) => ({
      city: d.city,
      difficulty: Math.round(d._avg.entryFriendly! * 10) / 10,
      count: d._count.entryFriendly,
    }))
    .sort((a, b) => b.difficulty - a.difficulty)

  return NextResponse.json({ cityCounts, cityDifficulty })
}
