import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import { NewsClient } from '@/components/news/news-client'
import PoliciesBlock from '@/components/policies/policies-block'
import prisma from '@/lib/db'

// 默认首屏数据（无筛选、第1页）缓存 5 分钟
const getDefaultNews = unstable_cache(
  async () => {
    const limit = 20
    const [news, total, originals] = await Promise.all([
      prisma.news.findMany({
        where: { hidden: false },
        orderBy: [{ isOriginal: 'desc' }, { publishedAt: 'desc' }],
        skip: 0,
        take: limit,
        select: {
          id: true, title: true, summary: true, category: true,
          source: true, url: true, coverImage: true, author: true,
          isOriginal: true, publishedAt: true, createdAt: true,
        },
      }),
      prisma.news.count({ where: { hidden: false } }),
      prisma.news.findMany({
        where: { isOriginal: true, hidden: false },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: {
          id: true, title: true, summary: true, category: true,
          source: true, url: true, coverImage: true, author: true,
          isOriginal: true, publishedAt: true, createdAt: true,
        },
      }),
    ])
    return { news, total, originals }
  },
  ['news-default'],
  { revalidate: 600 }
)

const getDefaultPolicies = unstable_cache(
  async () => {
    const [policies, policyTotal, policyProvinces, policyCities] = await Promise.all([
      prisma.policy.findMany({
        orderBy: [{ province: 'asc' }, { city: 'asc' }, { district: 'asc' }],
      }),
      prisma.policy.count(),
      prisma.policy.findMany({
        select: { province: true },
        distinct: ['province'],
        orderBy: { province: 'asc' },
      }),
      prisma.policy.groupBy({
        by: ['city'],
        where: { city: { not: null } },
      }),
    ])
    return { policies, policyTotal, policyProvinces, policyCities }
  },
  ['news-policies'],
  { revalidate: 3600 }
)

export const revalidate = 600 // 资讯 10分钟刷新，减少 DB 压力

async function NewsPageInner({
  searchParams,
}: {
  searchParams: { category?: string; page?: string; policyProvince?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const category = searchParams.category || ''
  const policyProvince = searchParams.policyProvince || ''
  const limit = 20
  const isDefaultView = !category && page === 1 && !policyProvince
  const showPolicies = !category || category === 'POLICY'

  let news: any[], total: number, originals: any[], allSignalsRaw: any[]
  let policies: any[], policyTotal: number, policyProvinces: any[], policyCities: any[]

  if (isDefaultView) {
    // 默认首屏：走缓存；allSignals 在 unstable_cache 外单独查
    const [newsData, policyData, signalsData] = await Promise.all([
      getDefaultNews(),
      getDefaultPolicies(),
      prisma.signalIssue.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { issueNo: 'desc' },
        select: { issueNo: true, title: true, publishedAt: true, intro: true, participants: true },
      }),
    ])
    news = newsData.news
    total = newsData.total
    originals = newsData.originals
    allSignalsRaw = signalsData
    policies = policyData.policies
    policyTotal = policyData.policyTotal
    policyProvinces = policyData.policyProvinces
    policyCities = policyData.policyCities
  } else {
    // 有筛选参数：直接查 DB
    const where: any = { hidden: false }
    if (category) where.category = category
    const policyWhere: any = {}
    if (policyProvince) policyWhere.province = policyProvince

    const results = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [{ isOriginal: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, summary: true, category: true,
          source: true, url: true, coverImage: true, author: true,
          isOriginal: true, publishedAt: true, createdAt: true,
        },
      }),
      prisma.news.count({ where }),
      page === 1 && !category
        ? prisma.news.findMany({
            where: { isOriginal: true, hidden: false },
            orderBy: { publishedAt: 'desc' },
            take: 3,
            select: {
              id: true, title: true, summary: true, category: true,
              source: true, url: true, coverImage: true, author: true,
              isOriginal: true, publishedAt: true, createdAt: true,
            },
          })
        : Promise.resolve([]),
      showPolicies
        ? prisma.policy.findMany({
            where: policyWhere,
            orderBy: [{ province: 'asc' }, { city: 'asc' }, { district: 'asc' }],
          })
        : Promise.resolve([]),
      showPolicies ? prisma.policy.count() : Promise.resolve(0),
      showPolicies
        ? prisma.policy.findMany({
            select: { province: true },
            distinct: ['province'],
            orderBy: { province: 'asc' },
          })
        : Promise.resolve([]),
      showPolicies
        ? prisma.policy.groupBy({
            by: ['city'],
            where: { city: { not: null } },
          })
        : Promise.resolve([]),
      prisma.signalIssue.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { issueNo: 'desc' },
        select: { issueNo: true, title: true, publishedAt: true, intro: true, participants: true },
      }),
    ])
    ;[news, total, originals, policies, policyTotal, policyProvinces, policyCities, allSignalsRaw] = results
  }

  // Serialize dates to strings for client component
  // Note: unstable_cache may return dates as strings already
  const toISO = (d: any) => {
    if (!d) return ''
    if (typeof d === 'string') return d
    if (d instanceof Date) return d.toISOString()
    return String(d)
  }
  const serializeNews = (items: any[]) =>
    items.map((item) => ({
      ...item,
      publishedAt: toISO(item.publishedAt),
      createdAt: toISO(item.createdAt),
      updatedAt: toISO(item.updatedAt),
    }))

  // Serialize allSignals (queried outside unstable_cache)
  const allSignals = (allSignalsRaw ?? []).map((s: any) => ({
    ...s,
    publishedAt: toISO(s.publishedAt),
    participants: s.participants as any[],
  }))

  // Derive latestSignal from allSignals for backward compat
  const latestSignal = allSignals.length > 0
    ? {
        issueNo: allSignals[0].issueNo,
        title: allSignals[0].title,
        publishedAt: allSignals[0].publishedAt,
        participants: allSignals[0].participants,
      }
    : null

  return (
    <>
      <NewsClient
        initialNews={serializeNews(news)}
        initialOriginals={serializeNews(originals)}
        initialTotal={total}
        latestSignal={latestSignal}
        allSignals={allSignals}
        recentOriginals={serializeNews(originals)}
        policiesSlot={
          showPolicies && policies.length > 0 ? (
            <PoliciesBlock
              policies={policies}
              provinces={policyProvinces.map((p) => p.province)}
              total={policyTotal}
              cityCount={policyCities.length}
              currentProvince={policyProvince}
            />
          ) : undefined
        }
      />
    </>
  )
}

export default function NewsPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string; policyProvince?: string }
}) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-hairline-soft rounded animate-pulse mb-4" />
          <div className="h-5 w-96 bg-hairline-soft rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-canvas rounded-xl p-6 shadow-sm">
              <div className="h-5 w-3/4 bg-hairline-soft rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-hairline-soft rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-hairline-soft rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    }>
      <NewsPageInner searchParams={searchParams} />
    </Suspense>
  )
}

