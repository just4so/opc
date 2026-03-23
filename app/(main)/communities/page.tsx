import { Suspense } from 'react'
import { CommunitiesPageClient } from '@/components/communities/communities-page-client'
import prisma from '@/lib/db'

export const revalidate = 300 // 5分钟缓存

async function CommunitiesPageInner({ searchParams }: { searchParams: { city?: string; page?: string } }) {
  const city = searchParams.city || ''
  const page = parseInt(searchParams.page || '1')
  const limit = 12

  const where: any = { status: 'ACTIVE' }
  if (city) where.city = city

  const [communities, total, cityGroupData, difficultyData] = await Promise.all([
    prisma.community.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
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
    prisma.community.count({ where }),
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
  const serializedCommunities = communities.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <CommunitiesPageClient
      initialCommunities={serializedCommunities}
      initialTotal={total}
      cityCounts={cityCounts}
      cityDifficulty={cityDifficulty}
    />
  )
}

export default function CommunitiesPage({ searchParams }: { searchParams: { city?: string; page?: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CommunitiesPageInner searchParams={searchParams} />
    </Suspense>
  )
}
