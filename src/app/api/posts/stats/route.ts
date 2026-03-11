import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [todayPostCount, todayAuthors, topicResults] = await Promise.all([
      prisma.post.count({
        where: {
          status: 'PUBLISHED',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          createdAt: { gte: startOfToday },
        },
        select: { authorId: true },
        distinct: ['authorId'],
      }),
      prisma.post.groupBy({
        by: ['topics'],
        where: { status: 'PUBLISHED' },
        _count: true,
      }),
    ])

    // Flatten topic counts from the groupBy result
    // Each post has topics as a string array; groupBy returns exact array matches
    // We need to count per individual topic
    const topicCountMap: Record<string, number> = {}
    for (const row of topicResults) {
      const topics = row.topics as string[]
      for (const t of topics) {
        topicCountMap[t] = (topicCountMap[t] || 0) + row._count
      }
    }

    const topicCounts = Object.entries(topicCountMap)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      todayStats: {
        postCount: todayPostCount,
        participantCount: todayAuthors.length,
      },
      topicCounts,
    })
  } catch (error) {
    console.error('Error fetching post stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
