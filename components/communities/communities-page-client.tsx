'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CommunitiesClient } from '@/components/communities/communities-client'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface CityDifficulty {
  city: string
  difficulty: number
  count: number
}

function DifficultyStars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <span className="inline-flex items-center" aria-label={`难度 ${value} 星`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
      {half && (
        <span className="relative inline-block h-3.5 w-3.5">
          <Star className="absolute h-3.5 w-3.5 text-gray-300" />
          <span className="absolute overflow-hidden" style={{ width: '50%' }}>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="h-3.5 w-3.5 text-gray-300" />
      ))}
    </span>
  )
}

function CityTabs({
  cityCounts,
  cityDifficulty,
  selectedCity,
  onCityChange,
}: {
  cityCounts: { city: string; count: number }[]
  cityDifficulty: CityDifficulty[]
  selectedCity: string
  onCityChange: (city: string) => void
}) {
  // 建立城市难度 map 方便 O(1) 查找
  const diffMap = new Map(cityDifficulty.map((d) => [d.city, d.difficulty]))

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
      <div className="flex items-center gap-2 pb-1 min-w-max lg:flex-wrap">
        <button
          onClick={() => onCityChange('')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            !selectedCity
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          全部
        </button>
        {cityCounts.map((c) => {
          const diff = diffMap.get(c.city)
          const isActive = selectedCity === c.city
          return (
            <button
              key={c.city}
              onClick={() => onCityChange(c.city)}
              className={cn(
                'flex flex-col items-center px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span>{c.city}<span className="ml-1 text-xs opacity-70">({c.count})</span></span>
              {diff != null && (
                <span className={cn('flex items-center gap-0.5 mt-0.5', isActive ? 'opacity-80' : '')}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-2.5 w-2.5',
                        i < Math.round(diff)
                          ? isActive ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'
                          : isActive ? 'text-white/40' : 'text-gray-300'
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {cityDifficulty.length > 0 && (
        <p className="text-xs text-gray-400 mt-1.5 pl-1">星级 = 入驻难度，基于创业者反馈</p>
      )}
    </div>
  )
}

interface CommunitiesPageClientProps {
  initialCommunities: Community[]
  initialTotal: number
  cityCounts: { city: string; count: number }[]
  cityDifficulty: CityDifficulty[]
}

export function CommunitiesPageClient({
  initialCommunities,
  initialTotal,
  cityCounts: initialCityCounts,
  cityDifficulty: initialCityDifficulty,
}: CommunitiesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const city = searchParams.get('city') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [communities, setCommunities] = useState<Community[]>(initialCommunities)
  const [pagination, setPagination] = useState<Pagination>({
    page: page,
    limit: 12,
    total: initialTotal,
    totalPages: Math.ceil(initialTotal / 12),
  })
  const [cityCounts, setCityCounts] = useState(initialCityCounts)
  const [cityDifficulty, setCityDifficulty] = useState(initialCityDifficulty)
  const [loading, setLoading] = useState(false)

  const [initialCity] = useState(city)
  const [initialPage] = useState(page)

  useEffect(() => {
    // Skip fetch on initial render — we already have SSR data
    if (city === initialCity && page === initialPage) return

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
        setCityDifficulty(statsData.cityDifficulty || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [city, page, initialCity, initialPage])

  const handleCityChange = (newCity: string) => {
    const params = new URLSearchParams()
    if (newCity) params.set('city', newCity)
    router.push(`/communities${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            全国OPC社区地图
          </h1>
          <p className="text-gray-600">
            发现身边的OPC社区，了解入驻政策和申请流程，横向比较各城市入驻难度
          </p>
        </div>
      </div>

      {/* 城市快筛 Tab（含难度星级）*/}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <CityTabs
            cityCounts={cityCounts}
            cityDifficulty={cityDifficulty}
            selectedCity={city}
            onCityChange={handleCityChange}
          />
        </div>
      </div>

      {loading ? (
        <div className="container mx-auto px-4 py-8">
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
