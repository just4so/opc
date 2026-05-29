import type { Metadata } from 'next'
import { PlazaClient } from '@/components/plaza/plaza-client'
import prisma from '@/lib/db'
import { getPlazaStats } from '@/lib/queries/post-stats'
import { auth } from '@/lib/auth'

export const revalidate = 60

export const metadata: Metadata = {
  title: '创业者广场 - 一人公司创业者交流社区 - OPC圈',
  description: '一人公司创业者真实交流广场，发现创业者卡片、分享入驻经验、创业心得、资源对接，加入OPC圈创业者社群。',
  alternates: {
    canonical: 'https://www.opcquan.com/plaza',
  },
  openGraph: {
    title: '创业者广场 | OPC圈',
    description: '一人公司创业者真实交流广场，发现创业者卡片、分享入驻经验、创业心得、资源对接。',
    url: 'https://www.opcquan.com/plaza',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
  },
}

export default async function PlazaPage() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [posts, total, stats, plazaUsers, plazaUserTotal, initialProjects, initialProjectTotal, session, recentProjects, recentProgress, recentUsers] = await Promise.all([
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
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    getPlazaStats(),
    prisma.user.findMany({
      where: {
        showInPlaza: true,
        OR: [
          { bio: { not: null } },
          { bio: { not: '' } },
          { projects: { some: { status: 'PUBLISHED' } } },
        ],
      },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      take: 50,
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
    }),
    prisma.user.count({
      where: {
        showInPlaza: true,
        OR: [
          { bio: { not: null } },
          { bio: { not: '' } },
          { projects: { some: { status: 'PUBLISHED' } } },
        ],
      },
    }),
    prisma.project.findMany({
      where: {
        status: 'PUBLISHED',
        description: { not: '' },
        owner: { showInPlaza: true },
      },
      orderBy: [
        { owner: { verified: 'desc' } },
        { createdAt: 'desc' },
      ],
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
    }),
    prisma.project.count({
      where: {
        status: 'PUBLISHED',
        owner: { showInPlaza: true },
      },
    }),
    auth(),
    prisma.project.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo }, status: 'PUBLISHED' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true, owner: { select: { name: true } } },
    }),
    prisma.progress.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, author: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo }, showInPlaza: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true },
    }),
  ])

  let onboardingData: { userId: string; mainTrack: string | null; location: string | null } | null = null
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true, mainTrack: true, location: true },
    })
    if (user && !user.onboardingCompleted) {
      onboardingData = {
        userId: session.user.id,
        mainTrack: user.mainTrack,
        location: user.location,
      }
    }
  }

  const postsWithCount = posts.map(p => ({
    ...p,
    commentCount: p._count.comments,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    deadline: p.deadline ? p.deadline.toISOString() : null,
  }))

  const plazaUsersWithCounts = plazaUsers.map(u => ({
    ...u,
    followerCount: u._count.followers,
    projectCount: u._count.projects,
  }))

  // Build ticker events
  const tickerEvents: { text: string; time: string }[] = []
  for (const p of recentProjects) {
    tickerEvents.push({
      text: `${p.owner.name || '匿名'} 发布了新产品「${p.name}」`,
      time: p.createdAt.toISOString(),
    })
  }
  for (const p of recentProgress) {
    tickerEvents.push({
      text: `${p.author.name || '匿名'} 记录了新进展`,
      time: p.createdAt.toISOString(),
    })
  }
  for (const u of recentUsers) {
    tickerEvents.push({
      text: `${u.name || '匿名'} 加入了 OPC圈`,
      time: u.createdAt.toISOString(),
    })
  }
  tickerEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const topEvents = tickerEvents.slice(0, 8)

  return (
    <PlazaClient
      initialPosts={postsWithCount as any}
      initialTotal={total}
      initialStats={stats}
      initialPlazaUsers={plazaUsersWithCounts}
      initialPlazaUserTotal={plazaUserTotal}
      initialProjects={initialProjects}
      initialProjectTotal={initialProjectTotal}
      onboardingData={onboardingData}
      tickerEvents={topEvents}
    />
  )
}
