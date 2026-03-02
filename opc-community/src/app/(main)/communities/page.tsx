import { Metadata } from 'next'
import { CommunitiesClient } from '@/components/communities/communities-client'
import prisma from '@/lib/db'

export const metadata: Metadata = {
  title: '全国OPC社区地图 - OPC创业圈',
  description: '浏览全国各地的OPC创业社区，了解入驻政策、申请流程和配套服务',
}

interface PageProps {
  searchParams: { city?: string; page?: string }
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
  const { communities, pagination } = await getCommunities(city, page)

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
      />
    </div>
  )
}
