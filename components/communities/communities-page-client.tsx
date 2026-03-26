'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CommunitiesClient } from '@/components/communities/communities-client'
import { cn } from '@/lib/utils'
import { MapPin, LayoutGrid } from 'lucide-react'

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
  applyDifficulty?: number | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface CommunitiesPageClientProps {
  initialCommunities: Community[]
  initialTotal: number
  cityCounts: { city: string; count: number }[]
  cityDifficulty: { city: string; difficulty: number; count: number }[]
}

export function CommunitiesPageClient({
  initialCommunities,
  initialTotal,
  cityCounts: initialCityCounts,
}: CommunitiesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pageFromUrl = parseInt(searchParams.get('page') || '1')

  // 城市筛选和视图模式：纯 client state，不触发路由重载
  const [selectedCity, setSelectedCity] = useState('')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')

  const [communities, setCommunities] = useState<Community[]>(initialCommunities)
  const [pagination, setPagination] = useState<Pagination>({
    page: pageFromUrl,
    limit: 12,
    total: initialTotal,
    totalPages: Math.ceil(initialTotal / 12),
  })
  const [cityCounts, setCityCounts] = useState(initialCityCounts)
  const [loading, setLoading] = useState(false)

  // 城市或分页变化时拉新数据
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCity) params.set('city', selectedCity)
    params.set('page', String(pageFromUrl))
    params.set('limit', '12')

    Promise.all([
      fetch(`/api/communities?${params}`).then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ])
      .then(([commData, statsData]) => {
        setCommunities(commData.data || [])
        setPagination(commData.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 })
        setCityCounts(statsData.cityCounts || initialCityCounts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedCity, pageFromUrl])

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    // 分页重置回第 1 页（只更新 URL page param，不重载组件树）
    if (pageFromUrl !== 1) {
      router.replace('/communities')
    }
  }

  const handleViewModeChange = (v: 'map' | 'list') => {
    setViewMode(v)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header：标题 + 城市筛选 + 视图切换合一 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 pt-8 pb-5">
          {/* 标题行 */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                全国 OPC 社区地图
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {initialTotal} 个社区 · {cityCounts.length} 座城市 · 真实入驻难度参考
              </p>
            </div>
            {/* 视图切换 */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
              <button
                onClick={() => handleViewModeChange('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                列表
              </button>
              <button
                onClick={() => handleViewModeChange('map')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'map' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                地图
              </button>
            </div>
          </div>

          {/* 城市筛选 Pill */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCityChange('')}
              className={cn(
                'px-3.5 py-1 rounded-full text-sm font-medium transition-all',
                !selectedCity
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
            >
              全部
            </button>
            {cityCounts.map((c) => (
              <button
                key={c.city}
                onClick={() => handleCityChange(c.city)}
                className={cn(
                  'px-3.5 py-1 rounded-full text-sm font-medium transition-all',
                  selectedCity === c.city
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                {c.city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      {loading ? (
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="h-36 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CommunitiesClient
          communities={communities.map((c) => ({ ...c, policies: c.policies as any }))}
          selectedCity={selectedCity || undefined}
          pagination={pagination}
          cityCounts={cityCounts}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      )}
    </div>
  )
}
