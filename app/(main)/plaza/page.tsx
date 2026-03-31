import { PlazaClient } from '@/components/plaza/plaza-client'
import prisma from '@/lib/db'
import { getPlazaStats } from '@/lib/queries/post-stats'

export const revalidate = 60 // 60秒 ISR，广场发帖可接受延迟

export default async function PlazaPage() {
  const [posts, total, stats] = await Promise.all([
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
    getPlazaStats(),
  ])

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
      initialStats={stats}
    />
  )
}
