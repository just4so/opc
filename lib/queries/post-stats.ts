import prisma from '@/lib/db'

export interface PlazaStats {
  todayStats: {
    postCount: number
    participantCount: number
  }
  topicCounts: { topic: string; count: number }[]
}

export async function getPlazaStats(): Promise<PlazaStats> {
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

  return {
    todayStats: {
      postCount: todayPostCount,
      participantCount: todayAuthors.length,
    },
    topicCounts,
  }
}
