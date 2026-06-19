import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CommunitiesPageClient } from '@/components/communities/communities-page-client'
import { CommunitySubmissionTrigger } from '@/components/communities/community-submission-trigger'
import prisma from '@/lib/db'

// 纯静态生成：build 时从 DB 拉取数据，Nginx 直接 serve 静态文件
// 数据更新时 push 代码触发重新 build 即可
export const dynamic = 'force-static'

async function getCommunityList() {
  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true, name: true, city: true, district: true,
      address: true, latitude: true, longitude: true,
      focusTracks: true, operator: true, totalWorkstations: true,
      featured: true, coverImage: true, entryFriendly: true,
      description: true,
      benefits: true,
    },
  })
  // 压缩 description 到卡片展示所需的最小量
  const mapped = communities.map((c) => ({
    ...c,
    description: c.description
      ? c.description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
      : '',
    // benefits 只保留 5个 key 的 boolean（有/无），去掉详情文本
    benefits: c.benefits
      ? Object.fromEntries(
          ['office', 'compute', 'business', 'funding', 'housing'].map((k) => [
            k,
            !!((c.benefits as any)?.[k]?.summary || (c.benefits as any)?.[k]?.items?.length),
          ])
        )
      : null,
  }))

  const cityCountMap: Record<string, number> = {}
  for (const c of mapped) {
    cityCountMap[c.city] = (cityCountMap[c.city] || 0) + 1
  }
  const cityCounts = Object.entries(cityCountMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)

  return { communities: mapped, cityCounts }
}

export const metadata: Metadata = {
  title: '全国OPC社区地图 - 一人公司入驻指南 - OPC圈',
  description: '覆盖全国主要城市的OPC（一人公司）社区完整信息，包含真实入驻评价、政策补贴、工位价格、入驻难度，帮你找到最适合的一人公司创业社区。',
  alternates: {
    canonical: 'https://www.opcquan.com/communities',
  },
  openGraph: {
    title: '全国OPC社区地图 | OPC圈',
    description: '覆盖全国主要城市OPC社区完整信息，真实入驻评价，一键找到适合你的一人公司社区。',
    url: 'https://www.opcquan.com/communities',
    siteName: 'OPC圈',
    locale: 'zh_CN',
    type: 'website',
    images: [{ url: 'https://www.opcquan.com/logo.png', width: 800, height: 500, alt: 'OPC圈社区地图' }],
  },
}

async function CommunitiesPageInner() {
  const { communities, cityCounts } = await getCommunityList()
  const allCommunities = communities.map((c) => ({ ...c }))

  return (
    <>
      <CommunitiesPageClient
        allCommunities={allCommunities}
        cityCounts={cityCounts}
      />
      {/* GEO FAQ — 页面底部，不影响主体内容 */}
      <div className="bg-canvas border-t mt-8">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <h2 className="text-lg font-semibold text-ink mb-5">OPC社区常见问题</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                q: '什么是OPC社区？',
                a: 'OPC社区（One Person Company社区）是专为一人公司、个体创业者设计的创业空间，通常由地方政府或国有平台运营，提供低成本办公空间、工商注册地址和创业政策支持。',
              },
              {
                q: '全国有多少个OPC社区？',
                a: 'OPC圈目前收录全国39个城市59个OPC社区，覆盖南京、扬州、杭州、深圳、北京、苏州、广州、上海等主要城市，数据持续更新。',
              },
              {
                q: 'OPC社区和联合办公有什么区别？',
                a: 'OPC社区通常有政府背景，能提供工商注册地址和政策补贴，联合办公一般不提供；费用通常更低，部分社区提供免费或补贴工位；社群更垂直，专注一人公司创业者群体。',
              },
              {
                q: '入驻OPC社区需要什么条件？',
                a: '一般需要已注册或计划注册一人公司／个体工商户，经营方向符合社区定位。具体条件因社区而异，建议查看各社区详情页或直接联系社区和询。',
              },
            ].map((item) => (
              <div key={item.q} className="bg-surface-soft rounded-xl p-5">
                <h3 className="font-medium text-ink mb-2 text-sm">{item.q}</h3>
                <p className="text-mute text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ash mt-4 text-center">
            查看完整问答： 
            <Link href="/faq" className="text-primary hover:underline">常见问题</Link>
             · 
            <Link href="/data" className="text-primary hover:underline">社区数据统计</Link>
          </p>
        </div>
      </div>
      <CommunitySubmissionTrigger />
    </>
  )
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="bg-canvas border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-surface-card rounded-full animate-pulse mb-2" />
            <div className="h-4 w-72 bg-surface-card rounded-full animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <div className="h-36 bg-surface-card animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-surface-card rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-surface-card rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CommunitiesPageInner />
    </Suspense>
  )
}
