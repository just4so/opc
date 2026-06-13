import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

// 广场产品列表 — 60 秒缓存，取 20 条（默认 tab 首屏数据）
export const getPlazaProjects = unstable_cache(
  async () => {
    return prisma.project.findMany({
      where: {
        status: 'PUBLISHED',
        contentType: 'PROJECT',
        description: { not: '' },
        owner: { showInPlaza: true },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        images: true,
        stage: true,
        website: true,
        contentType: true,
        commentCount: true,
        likeCount: true,
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            location: true,
            verified: true,
          },
        },
      },
    })
  },
  ['plaza-projects'],
  { revalidate: 300 }
)

export const getPlazaProjectCount = unstable_cache(
  async () => {
    return prisma.project.count({
      where: {
        status: 'PUBLISHED',
        contentType: 'PROJECT',
        owner: { showInPlaza: true },
      },
    })
  },
  ['plaza-project-count'],
  { revalidate: 300 }
)

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
  { revalidate: 300 }
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
  { revalidate: 300 }
)
