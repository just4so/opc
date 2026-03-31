import prisma from '@/lib/db'

export interface PlazaStats {
  todayStats: {
    postCount: number
    participantCount: number
  }
  topicCounts: { topic: string; count: number }[]
  hotTopics: { topic: string; count: number }[]
  activeUsers: { id: string; name: string | null; username: string; avatar: string | null; postCount: number }[]
  weekCount: number
  monthCount: number
}

export async function getPlazaStats(): Promise<PlazaStats> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    todayPostCount,
    todayAuthors,
    topicResults,
    hotTopicResults,
    weekCount,
    monthCount,
    weeklyPosters,
  ] = await Promise.all([
    prisma.post.count({
      where: { status: 'PUBLISHED', createdAt: { gte: startOfToday } },
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED', createdAt: { gte: startOfToday } },
      select: { authorId: true },
      distinct: ['authorId'],
    }),
    prisma.post.groupBy({
      by: ['topics'],
      where: { status: 'PUBLISHED' },
      _count: true,
    }),
    prisma.post.groupBy({
      by: ['topics'],
      where: { status: 'PUBLISHED', createdAt: { gte: sevenDaysAgo } },
      _count: true,
    }),
    prisma.post.count({
      where: { status: 'PUBLISHED', createdAt: { gte: startOfWeek } },
    }),
    prisma.post.count({
      where: { status: 'PUBLISHED', createdAt: { gte: startOfMonth } },
    }),
    prisma.post.groupBy({
      by: ['authorId'],
      where: { status: 'PUBLISHED', createdAt: { gte: startOfWeek } },
      _count: { authorId: true },
      orderBy: { _count: { authorId: 'desc' } },
      take: 5,
    }),
  ])

  // Build overall topic counts
  const topicCountMap: Record<string, number> = {}
  for (const row of topicResults) {
    for (const t of row.topics as string[]) {
      topicCountMap[t] = (topicCountMap[t] || 0) + row._count
    }
  }
  const topicCounts = Object.entries(topicCountMap)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)

  // Build hot topics from last 7 days
  const hotTopicMap: Record<string, number> = {}
  for (const row of hotTopicResults) {
    for (const t of row.topics as string[]) {
      hotTopicMap[t] = (hotTopicMap[t] || 0) + row._count
    }
  }
  const hotTopics = Object.entries(hotTopicMap)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Fetch active user details
  const activeUserIds = weeklyPosters.map(p => p.authorId)
  const activeUserDetails = await prisma.user.findMany({
    where: { id: { in: activeUserIds } },
    select: { id: true, name: true, username: true, avatar: true },
  })
  const activeUsers = activeUserIds.map(id => {
    const u = activeUserDetails.find(u => u.id === id)!
    const postCount = weeklyPosters.find(p => p.authorId === id)?._count.authorId ?? 0
    return { ...u, postCount }
  })

  return {
    todayStats: {
      postCount: todayPostCount,
      participantCount: todayAuthors.length,
    },
    topicCounts,
    hotTopics,
    activeUsers,
    weekCount,
    monthCount,
  }
}
