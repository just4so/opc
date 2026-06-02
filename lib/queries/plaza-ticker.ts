import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

export const getTickerData = unstable_cache(
  async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [recentProjects, recentProgress, recentUsers] = await Promise.all([
      prisma.project.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo }, status: 'PUBLISHED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { name: true, slug: true, createdAt: true, owner: { select: { name: true } } },
      }),
      prisma.progress.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, author: { select: { name: true } }, project: { select: { slug: true, name: true } } },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo }, showInPlaza: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { name: true, username: true, createdAt: true },
      }),
    ])
    return { recentProjects, recentProgress, recentUsers }
  },
  ['plaza-ticker'],
  { revalidate: 60 }
)
