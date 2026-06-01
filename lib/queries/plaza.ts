import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

// 创业者列表 — 60 秒缓存，取 20 条
export const getPlazaUsers = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      where: {
        showInPlaza: true,
        OR: [
          { bio: { not: null } },
          { bio: { not: '' } },
          { projects: { some: { status: 'PUBLISHED' } } },
        ],
      },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        mainTrack: true,
        startupStage: true,
        verified: true,
        verifyType: true,
        projects: {
          where: { status: 'PUBLISHED' },
          take: 2,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            stage: true,
            website: true,
          },
        },
        _count: {
          select: {
            followers: true,
            projects: true,
          },
        },
      },
    })
    return users
  },
  ['plaza-users'],
  { revalidate: 60 }
)

export const getPlazaUserCount = unstable_cache(
  async () => {
    return prisma.user.count({
      where: {
        showInPlaza: true,
        OR: [
          { bio: { not: null } },
          { bio: { not: '' } },
          { projects: { some: { status: 'PUBLISHED' } } },
        ],
      },
    })
  },
  ['plaza-user-count'],
  { revalidate: 60 }
)
