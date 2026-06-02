import type { Metadata } from 'next'
import { PlazaClient } from '@/components/plaza/plaza-client'
import { getPlazaUsers, getPlazaUserCount, getPlazaProjects, getPlazaProjectCount } from '@/lib/queries/plaza'
import { getTickerData } from '@/lib/queries/plaza-ticker'

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
  // 全部使用带缓存的查询函数，不再有 auth() 调用
  // 页面变为 Static（ISR 60s），大幅提升缓存命中时的响应速度
  const [plazaUsers, plazaUserTotal, initialProjects, initialProjectTotal, { recentProjects, recentProgress, recentUsers }] =
    await Promise.all([
      getPlazaUsers(),
      getPlazaUserCount(),
      getPlazaProjects(),
      getPlazaProjectCount(),
      getTickerData(),
    ])

  const plazaUsersWithCounts = plazaUsers.map(u => ({
    ...u,
    followerCount: u._count.followers,
    projectCount: u._count.projects,
  }))

  // Build ticker events
  const tickerEvents: { text: string; time: string; link: string }[] = []
  for (const p of recentProjects) {
    tickerEvents.push({
      text: `🚀 ${p.owner.name || '匿名'} 发布了「${p.name}」`,
      time: new Date(p.createdAt).toISOString(),
      link: `/projects/${p.slug}`,
    })
  }
  for (const p of recentProgress) {
    tickerEvents.push({
      text: `📝 ${p.author.name || '匿名'} 更新了${p.project ? `「${p.project.name}」的` : ''}产品进展`,
      time: new Date(p.createdAt).toISOString(),
      link: p.project ? `/projects/${p.project.slug}` : '/plaza',
    })
  }
  for (const u of recentUsers) {
    tickerEvents.push({
      text: `👋 欢迎 ${u.name || u.username} 加入创业者广场`,
      time: new Date(u.createdAt).toISOString(),
      link: `/profile/${u.username}`,
    })
  }
  tickerEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const topEvents = tickerEvents.slice(0, 8)

  return (
    <PlazaClient
      initialPlazaUsers={plazaUsersWithCounts}
      initialPlazaUserTotal={plazaUserTotal}
      initialProjects={initialProjects}
      initialProjectTotal={initialProjectTotal}
      tickerEvents={topEvents}
    />
  )
}
