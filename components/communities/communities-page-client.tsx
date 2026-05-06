'use client'

// 架构说明：全量数据在 SSR 时一次性传入，城市筛选和分页全部前端完成。
// 统计数据（cityCounts / cityDifficulty）由客户端异步加载，不阻塞 SSR。

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CommunitiesClient } from '@/components/communities/communities-client'
import { cn } from '@/lib/utils'
import { MapPin, LayoutGrid } from 'lucide-react'

const PAGE_SIZE = 12

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
  focusTracks: string[]
  operator?: string | null
  totalWorkstations?: number | null
  benefits?: any
  featured: boolean
  coverImage?: string | null
  entryFriendly?: number | null
}

interface CommunitiesPageClientProps {
  allCommunities: Community[]
}

export function CommunitiesPageClient({
  allCommunities,
}: CommunitiesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get('city') ?? '')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [page, setPage] = useState(1)
  const [cityCounts, setCityCounts] = useState<{ city: string; count: number }[]>([])

  // 异步加载统计数据
  useEffect(() => {
    fetch('/api/community-stats')
      .then((res) => res.json())
      .then((data) => {
        setCityCounts(data.cityCounts || [])
      })
      .catch(() => {
        // 降级：从全量数据中本地计算城市统计
        const counts: Record<string, number> = {}
        allCommunities.forEach((c) => {
          counts[c.city] = (counts[c.city] || 0) + 1
        })
        const sorted = Object.entries(counts)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
        setCityCounts(sorted)
      })
  }, [allCommunities])

  // 浏览器前进/后退时同步 URL 参数
  useEffect(() => {
    const city = searchParams.get('city') ?? ''
    setSelectedCity(city)
    setPage(1)
  }, [searchParams])

  // 城市筛选：纯前端 filter，零延迟
  const filtered = useMemo(() => {
    if (!selectedCity) return allCommunities
    return allCommunities.filter((c) => c.city === selectedCity)
  }, [allCommunities, selectedCity])

  // 分页：前端 slice
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    setPage(1)
    const params = new URLSearchParams(searchParams.toString())
    if (city) {
      params.set('city', city)
    } else {
      params.delete('city')
    }
    router.replace(`/communities?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header：标题 + 统计 + 视图切换 + 城市筛选 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 pt-8 pb-5">
          {/* 标题行 */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                全国 OPC 社区地图
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {allCommunities.length} 个社区 · {cityCounts.length || '—'} 座城市 · 真实入驻友好度参考
              </p>
            </div>
            {/* 视图切换 */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                列表
              </button>
              <button
                onClick={() => setViewMode('map')}
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
      <CommunitiesClient
        communities={paginated}
        allCommunities={filtered}
        selectedCity={selectedCity || undefined}
        pagination={{ page, total: filtered.length, totalPages }}
        cityCounts={cityCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPageChange={setPage}
      />
    </div>
  )
}
