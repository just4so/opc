import { PlazaClient } from '@/components/plaza/plaza-client'
import prisma from '@/lib/db'

export const revalidate = 60 // 60秒 ISR，广场发帖可接受延迟

export default async function PlazaPage() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [posts, total, todayPostCount, todayAuthors, topicResults] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            level: true,
            verified: true,
            location: true,
            mainTrack: true,
            startupStage: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
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

  // Flatten topic counts
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

  const postsWithCount = posts.map(p => ({
    ...p,
    commentCount: p._count.comments,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <PlazaClient
      initialPosts={postsWithCount as any}
      initialTotal={total}
      initialStats={{
        todayStats: {
          postCount: todayPostCount,
          participantCount: todayAuthors.length,
        },
        topicCounts,
      }}
    />
  )
}
