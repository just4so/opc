'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CommunitiesClient } from '@/components/communities/communities-client'

interface Community {
  id: string
  slug: string
  name: string
  city: string
  district?: string | null
  address: string
  latitude?: number | null
  longitude?: number | null
  description: string
  type: string
  focus: string[]
  operator?: string | null
  spaceSize?: string | null
  workstations?: number | null
  policies?: any
  status: string
  featured: boolean
  coverImage?: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function CommunitiesContent() {
  const searchParams = useSearchParams()
  const city = searchParams.get('city') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [communities, setCommunities] = useState<Community[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [cityCounts, setCityCounts] = useState<{ city: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    params.set('page', String(page))
    params.set('limit', '12')

    Promise.all([
      fetch(`/api/communities?${params}`).then(res => res.json()),
      fetch('/api/stats').then(res => res.json()),
    ])
      .then(([commData, statsData]) => {
        setCommunities(commData.data || [])
        setPagination(commData.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 })
        setCityCounts(statsData.cityCounts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city, page])

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

      {loading ? (
        <div className="container mx-auto px-4 py-8">
          {/* 筛选器骨架 */}
          <div className="flex gap-4 mb-8">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* 地图区域骨架 */}
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse mb-8" />
          {/* 列表骨架 */}
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
      ) : (
        <CommunitiesClient
          communities={communities.map((c) => ({
            ...c,
            policies: c.policies as any,
          }))}
          selectedCity={city || undefined}
          pagination={pagination}
          cityCounts={cityCounts}
        />
      )}
    </div>
  )
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={null}>
      <CommunitiesContent />
    </Suspense>
  )
}
