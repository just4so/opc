import type { Metadata } from 'next'
import { PlazaClient } from '@/components/plaza/plaza-client'
import prisma from '@/lib/db'
import { getPlazaStats } from '@/lib/queries/post-stats'

export const revalidate = 60 // 60秒 ISR

export const metadata: Metadata = {
  title: '创业广场 - 一人公司创业者交流社区 - OPC圈',
  description: '一人公司创业者真实交流广场，分享入驻经验、创业心得、资源对接，加入OPC圈创业者社群。',
  alternates: {
    canonical: 'https://www.opcquan.com/plaza',
  },
  openGraph: {
    title: '创业广场 | OPC圈',
    description: '一人公司创业者真实交流广场，分享入驻经验、创业心得、资源对接。',
    url: 'https://www.opcquan.com/plaza',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
  },
}

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
    deadline: p.deadline ? p.deadline.toISOString() : null,
  }))

  return (
    <PlazaClient
      initialPosts={postsWithCount as any}
      initialTotal={total}
      initialStats={stats}
    />
  )
}
