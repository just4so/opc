'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CommunitiesClient } from '@/components/communities/communities-client'
import { cn } from '@/lib/utils'
import { MapPin, LayoutGrid, Search, ChevronDown, ChevronRight, X } from 'lucide-react'
import { CITIES } from '@/constants/cities'

const PAGE_SIZE = 12

const cityToProvince: Record<string, string> = {}
for (const c of CITIES) {
  cityToProvince[c.name] = c.province
}

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

interface ProvinceGroup {
  province: string
  communities: Community[]
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
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/community-stats')
      .then((res) => res.json())
      .then((data) => {
        setCityCounts(data.cityCounts || [])
      })
      .catch(() => {
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

  useEffect(() => {
    const city = searchParams.get('city') ?? ''
    setSelectedCity(city)
    setPage(1)
  }, [searchParams])

  const isSearching = searchQuery.trim().length > 0

  const filtered = useMemo(() => {
    let result = allCommunities
    if (selectedCity) {
      result = result.filter((c) => c.city === selectedCity)
    }
    if (isSearching) {
      const keywords = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
      result = result.filter((c) => {
        const haystack = `${c.name} ${c.city}`.toLowerCase()
        return keywords.every((kw) => haystack.includes(kw))
      })
    }
    return result
  }, [allCommunities, selectedCity, searchQuery, isSearching])

  const provinceGroups = useMemo((): ProvinceGroup[] => {
    if (isSearching || selectedCity) return []
    const groups: Record<string, Community[]> = {}
    for (const c of filtered) {
      const province = cityToProvince[c.city] || c.city
      if (!groups[province]) groups[province] = []
      groups[province].push(c)
    }
    return Object.entries(groups)
      .map(([province, communities]) => ({ province, communities }))
      .sort((a, b) => b.communities.length - a.communities.length)
  }, [filtered, isSearching, selectedCity])

  useEffect(() => {
    if (provinceGroups.length > 0 && expandedProvinces.size === 0) {
      setExpandedProvinces(new Set(provinceGroups.slice(0, 3).map((g) => g.province)))
    }
  }, [provinceGroups])

  const showProvinceView = viewMode === 'list' && !isSearching && !selectedCity
  const showFlatList = viewMode === 'list' && (isSearching || !!selectedCity)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    setPage(1)
    setSearchQuery('')
    const params = new URLSearchParams(searchParams.toString())
    if (city) {
      params.set('city', city)
    } else {
      params.delete('city')
    }
    router.replace(`/communities?${params.toString()}`, { scroll: false })
  }

  const toggleProvince = useCallback((province: string) => {
    setExpandedProvinces((prev) => {
      const next = new Set(prev)
      if (next.has(province)) {
        next.delete(province)
      } else {
        next.add(province)
      }
      return next
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
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

          {/* 搜索框 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="搜索社区名称或城市..."
              className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 城市筛选 Pill */}
          {!isSearching && (
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
          )}

          {/* 搜索结果提示 */}
          {isSearching && (
            <p className="text-sm text-gray-500">
              找到 <span className="font-medium text-gray-800">{filtered.length}</span> 个社区
              {filtered.length === 0 && '，试试其他关键词'}
            </p>
          )}
        </div>
      </div>

      {/* 省份分组列表 */}
      {showProvinceView && (
        <ProvinceGroupedList
          groups={provinceGroups}
          expandedProvinces={expandedProvinces}
          onToggle={toggleProvince}
        />
      )}

      {/* 平铺列表（搜索或选中城市时） */}
      {showFlatList && (
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
      )}

      {/* 地图视图 */}
      {viewMode === 'map' && (
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
      )}
    </div>
  )
}

function ProvinceGroupedList({
  groups,
  expandedProvinces,
  onToggle,
}: {
  groups: ProvinceGroup[]
  expandedProvinces: Set<string>
  onToggle: (province: string) => void
}) {
  return (
    <div className="container mx-auto px-4 py-6 space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedProvinces.has(group.province)
        return (
          <div key={group.province} className="bg-white rounded-xl overflow-hidden border border-gray-100">
            <button
              onClick={() => onToggle(group.province)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-semibold text-gray-900">{group.province}</span>
                <span className="text-sm text-gray-400">{group.communities.length} 个社区</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from(new Set(group.communities.map((c) => c.city))).slice(0, 5).map((city) => (
                  <span key={city} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {city}
                  </span>
                ))}
              </div>
            </button>
            {isExpanded && (
              <div className="px-5 pb-5 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.communities.map((community) => (
                    <CommunityCardInline key={community.id} community={community} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { CommunityCard } from '@/components/communities/community-card'

function CommunityCardInline({ community }: { community: Community }) {
  return (
    <CommunityCard
      community={{
        ...community,
        district: community.district ?? undefined,
        operator: community.operator ?? undefined,
        totalWorkstations: community.totalWorkstations ?? undefined,
      }}
    />
  )
}
