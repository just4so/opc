import { Metadata } from 'next'
import { CommunitiesClient } from '@/components/communities/communities-client'
import prisma from '@/lib/db'

// ISR: 每小时重新生成页面
export const revalidate = 3600

export const metadata: Metadata = {
  title: '全国OPC社区地图 - OPC创业圈',
  description: '浏览全国各地的OPC创业社区，了解入驻政策、申请流程和配套服务',
}

interface PageProps {
  searchParams: { city?: string; page?: string }
}

async function getCityCounts() {
  const result = await prisma.community.groupBy({
    by: ['city'],
    where: { status: 'ACTIVE' },
    _count: { city: true },
    orderBy: { _count: { city: 'desc' } },
  })

  return result.map((c) => ({
    city: c.city,
    count: c._count.city,
  }))
}

async function getCommunities(city?: string, page: number = 1) {
  const limit = 12
  const where: any = {
    status: 'ACTIVE',
  }

  if (city) {
    where.city = city
  }

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.community.count({ where }),
  ])

  return {
    communities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export default async function CommunitiesPage({ searchParams }: PageProps) {
  const city = searchParams.city
  const page = parseInt(searchParams.page || '1')
  const [{ communities, pagination }, cityCounts] = await Promise.all([
    getCommunities(city, page),
    getCityCounts(),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            全国OPC社区地图
          </h1>
          <p className="text-gray-600">
            发现身边的OPC社区，了解入驻政策和申请流程
          </p>
        </div>
      </div>

      <CommunitiesClient
        communities={communities.map((c) => ({
          ...c,
          policies: c.policies as any,
        }))}
        selectedCity={city}
        pagination={pagination}
        cityCounts={cityCounts}
      />
    </div>
  )
}
