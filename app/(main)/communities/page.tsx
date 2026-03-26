import { Suspense } from 'react'
import { CommunitiesPageClient } from '@/components/communities/communities-page-client'
import prisma from '@/lib/db'

export const revalidate = 3600 // 1小时缓存（数据变化低频，ISR 静态化首屏）

async function CommunitiesPageInner() {
  // 一次性拉全量数据，传给客户端做前端 filter/分页
  // 当前 104 条 × 0.69KB ≈ 71KB，完全可接受
  const [communities, cityGroupData, difficultyData] = await Promise.all([
    prisma.community.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        district: true,
        address: true,
        latitude: true,
        longitude: true,
        description: true,
        type: true,
        focus: true,
        operator: true,
        spaceSize: true,
        workstations: true,
        policies: true,
        status: true,
        featured: true,
        coverImage: true,
        createdAt: true,
        applyDifficulty: true,
      },
    }),
    prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE' },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
    }),
    prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE', applyDifficulty: { not: null } },
      _avg: { applyDifficulty: true },
      _count: { applyDifficulty: true },
    }),
  ])

  const cityCounts = cityGroupData.map((c) => ({
    city: c.city,
    count: c._count.city,
  }))

  const cityDifficulty = difficultyData
    .filter((d) => d._avg.applyDifficulty !== null)
    .map((d) => ({
      city: d.city,
      difficulty: Math.round(d._avg.applyDifficulty! * 10) / 10,
      count: d._count.applyDifficulty,
    }))
    .sort((a, b) => b.difficulty - a.difficulty)

  // Serialize dates for client component
  const allCommunities = communities.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <CommunitiesPageClient
      allCommunities={allCommunities}
      cityCounts={cityCounts}
      cityDifficulty={cityDifficulty}
    />
  )
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="h-36 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
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
