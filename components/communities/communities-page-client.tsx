'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CommunitiesClient } from '@/components/communities/communities-client'
import { cn } from '@/lib/utils'
import { MapPin, LayoutGrid, Search, ChevronDown, ChevronRight, X, Star, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { CITIES, HOT_CITIES } from '@/constants/cities'
import { pinyin } from 'pinyin-pro'
import { CommunityCard } from '@/components/communities/community-card'

function getCityInitial(city: string): string {
  const result = pinyin(city, { pattern: 'first', toneType: 'none', type: 'array' })
  return result[0]?.toUpperCase() ?? city[0].toUpperCase()
}

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
  initialCommunities: Community[]
  initialTotal: number
  cityCounts: { city: string; count: number }[]
}

async function fetchCommunities(params: {
  page: number
  city?: string
  signal?: AbortSignal
}): Promise<{ communities: Community[]; total: number; hasMore: boolean }> {
  const url = new URL('/api/communities', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('pageSize', String(PAGE_SIZE))
  if (params.city) url.searchParams.set('city', params.city)

  const res = await fetch(url.toString(), { signal: params.signal })
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  return res.json()
}

export function CommunitiesPageClient({
  initialCommunities,
  initialTotal,
  cityCounts,
}: CommunitiesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [communities, setCommunities] = useState<Community[]>(initialCommunities)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialTotal > PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get('city') ?? '')
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set())
  const [showAllCities, setShowAllCities] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // On mount: if URL has a city param, fetch page 1 for that city so the list shows city data
  useEffect(() => {
    const city = searchParams.get('city') ?? ''
    if (!city) return
    setLoading(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    fetchCommunities({ page: 1, city, signal: ctrl.signal })
      .then((data) => {
        setCommunities(data.communities)
        setHasMore(data.hasMore)
        setTotal(data.total)
        setLoading(false)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoading(false)
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount only

  // Infinite scroll observer — recreates when key deps change
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, selectedCity, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const nextPage = page + 1
      const result = await fetchCommunities({
        page: nextPage,
        city: selectedCity || undefined,
        signal: controller.signal,
      })
      setCommunities((prev) => [...prev, ...result.communities])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load more communities:', err)
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [page, selectedCity, loading, hasMore])

  const handleCityChange = useCallback(
    async (city: string) => {
      setSelectedCity(city)
      setPage(1)
      setSearchQuery('')
      setShowAllCities(false)

      const params = new URLSearchParams(searchParams.toString())
      if (city) {
        params.set('city', city)
      } else {
        params.delete('city')
      }
      router.replace(`/communities?${params.toString()}`, { scroll: false })

      if (city === '') {
        setCommunities(initialCommunities)
        setTotal(initialTotal)
        setHasMore(initialTotal > PAGE_SIZE)
        return
      }

      setLoading(true)
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const result = await fetchCommunities({ page: 1, city, signal: controller.signal })
        setCommunities(result.communities)
        setTotal(result.total)
        setHasMore(result.hasMore)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch city communities:', err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    },
    [searchParams, router, initialCommunities, initialTotal]
  )

  const isSearching = searchQuery.trim().length > 0

  const filtered = useMemo(() => {
    if (!isSearching) return communities
    const keywords = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return communities.filter((c) => {
      const haystack = `${c.name} ${c.city}`.toLowerCase()
      return keywords.every((kw) => haystack.includes(kw))
    })
  }, [communities, searchQuery, isSearching])

  const featuredIds = useMemo(
    () => new Set(communities.filter((c) => c.featured).map((c) => c.id)),
    [communities]
  )

  const provinceGroups = useMemo((): ProvinceGroup[] => {
    if (isSearching || selectedCity) return []
    const nonFeatured = communities.filter((c) => !featuredIds.has(c.id))
    const groups: Record<string, Community[]> = {}
    for (const c of nonFeatured) {
      const province = cityToProvince[c.city] || c.city
      if (!groups[province]) groups[province] = []
      groups[province].push(c)
    }
    const result = Object.entries(groups)
      .map(([province, comms]) => ({ province, communities: comms }))
      .sort((a, b) => b.communities.length - a.communities.length)

    const featuredList = communities.filter((c) => featuredIds.has(c.id))
    if (featuredList.length > 0) {
      result.unshift({ province: '推荐社区', communities: featuredList })
    }
    return result
  }, [communities, isSearching, selectedCity, featuredIds])

  useEffect(() => {
    if (provinceGroups.length > 0 && expandedProvinces.size === 0) {
      const initial = new Set(provinceGroups.slice(0, 3).map((g) => g.province))
      initial.add('推荐社区')
      setExpandedProvinces(initial)
    }
  }, [provinceGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  const showProvinceView = viewMode === 'list' && !isSearching && !selectedCity
  const showFlatList = viewMode === 'list' && (isSearching || !!selectedCity)

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
      <PageHeader
        title={<>全国 OPC <span className="text-primary">社区地图</span></>}
        subtitle={`${total} 个社区 · ${cityCounts.length || '-'} 座城市 · 真实入驻友好度参考`}
        theme="communities"
      >
        <div className="flex items-center gap-1 bg-surface-card rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'list' ? 'bg-canvas text-ink shadow-sm' : 'text-ash hover:text-mute'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            列表
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'map' ? 'bg-canvas text-ink shadow-sm' : 'text-ash hover:text-mute'
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            地图
          </button>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 pt-5">
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ash" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索社区名称或城市..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-hairline-soft text-sm placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:scale-[1.01] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-mute"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 城市筛选 Pill */}
        {!isSearching &&
          (() => {
            const hotCities = cityCounts
              .filter((c) => HOT_CITIES.includes(c.city))
              .sort((a, b) => HOT_CITIES.indexOf(a.city) - HOT_CITIES.indexOf(b.city))
            const otherCities = cityCounts.filter((c) => !HOT_CITIES.includes(c.city))

            return (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCityChange('')}
                    className={cn('city-pill', !selectedCity && 'city-pill-active')}
                  >
                    全部
                  </button>
                  {hotCities.map((c) => (
                    <button
                      key={c.city}
                      onClick={() => handleCityChange(c.city)}
                      className={cn('city-pill', selectedCity === c.city && 'city-pill-active')}
                    >
                      {c.city}
                    </button>
                  ))}
                  {otherCities.length > 0 && (
                    <button
                      onClick={() => setShowAllCities(!showAllCities)}
                      className="city-pill city-pill-more"
                    >
                      {showAllCities ? '收起' : `全部城市 (${cityCounts.length})`}
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 ml-0.5 transition-transform duration-200',
                          showAllCities && 'rotate-180'
                        )}
                      />
                    </button>
                  )}
                </div>
                {/* 展开的全部城市 — 按首字母分组 */}
                <div className={`city-expand-container ${showAllCities ? 'expanded' : ''}`}>
                  <div className="pt-2 space-y-3">
                    {(() => {
                      const grouped: Record<string, typeof cityCounts> = {}
                      cityCounts.forEach((c) => {
                        const initial = getCityInitial(c.city)
                        if (!grouped[initial]) grouped[initial] = []
                        grouped[initial].push(c)
                      })
                      const sortedLetters = Object.keys(grouped).sort()
                      return sortedLetters.map((letter) => (
                        <div key={letter} className="flex items-start gap-2">
                          <span className="text-xs font-medium text-ash w-4 flex-shrink-0 pt-1">
                            {letter}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {grouped[letter].map((c) => (
                              <button
                                key={c.city}
                                onClick={() => handleCityChange(c.city)}
                                className={cn(
                                  'city-pill',
                                  selectedCity === c.city && 'city-pill-active'
                                )}
                              >
                                {c.city}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )
          })()}

        {/* 搜索结果提示 */}
        {isSearching && (
          <p className="text-sm text-mute">
            找到 <span className="font-medium text-ink">{filtered.length}</span> 个社区
            {filtered.length === 0 && ',试试其他关键词'}
          </p>
        )}
      </div>

      {/* 省份分组列表（全局视图）*/}
      {showProvinceView && (
        <ProvinceGroupedList
          groups={provinceGroups}
          expandedProvinces={expandedProvinces}
          onToggle={toggleProvince}
          total={total}
          loading={loading}
          hasMore={hasMore}
          sentinelRef={sentinelRef}
        />
      )}

      {/* 平铺列表（城市筛选或搜索）*/}
      {showFlatList && (
        <div>
          <CommunitiesClient
            communities={filtered}
            allCommunities={communities}
            selectedCity={selectedCity || undefined}
            pagination={{ page: 1, total: filtered.length, totalPages: 1 }}
            cityCounts={cityCounts}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPageChange={() => {}}
          />
          <div className="container mx-auto px-4 pb-6">
            <div ref={sentinelRef} className="h-4" />
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-ash" />
              </div>
            )}
            {!hasMore && communities.length > PAGE_SIZE && (
              <p className="text-center text-xs text-ash py-4">已全部加载</p>
            )}
          </div>
        </div>
      )}

      {/* 地图视图 */}
      {viewMode === 'map' && (
        <div>
          <CommunitiesClient
            communities={filtered}
            allCommunities={communities}
            selectedCity={selectedCity || undefined}
            pagination={{ page: 1, total: filtered.length, totalPages: 1 }}
            cityCounts={cityCounts}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPageChange={() => {}}
          />
          <div className="container mx-auto px-4 pb-6">
            <div ref={sentinelRef} className="h-4" />
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-ash" />
              </div>
            )}
            {!hasMore && communities.length > PAGE_SIZE && (
              <p className="text-center text-xs text-ash py-4">已全部加载</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProvinceGroupedList({
  groups,
  expandedProvinces,
  onToggle,
  total,
  loading,
  hasMore,
  sentinelRef,
}: {
  groups: ProvinceGroup[]
  expandedProvinces: Set<string>
  onToggle: (province: string) => void
  total: number
  loading: boolean
  hasMore: boolean
  sentinelRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="container mx-auto px-4 py-6 space-y-3">
      {groups.map((group) => {
        const isRecommended = group.province === '推荐社区'
        const isExpanded = isRecommended || expandedProvinces.has(group.province)

        if (isRecommended) {
          return (
            <div key={group.province} className="mb-6">
              <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                推荐社区
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.communities.map((community) => (
                  <CommunityCardInline key={community.id} community={community} recommended />
                ))}
              </div>
            </div>
          )
        }

        return (
          <div
            key={group.province}
            className="bg-canvas rounded-xl overflow-hidden border border-hairline-soft"
          >
            <button
              onClick={() => onToggle(group.province)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-soft transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-ash transition-transform" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-ash transition-transform" />
                )}
                <span className="font-semibold text-ink">{group.province}</span>
                <span className="text-sm text-ash">{group.communities.length} 个社区</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from(new Set(group.communities.map((c) => c.city)))
                  .slice(0, 5)
                  .map((city) => (
                    <span
                      key={city}
                      className="text-xs text-ash bg-surface-soft px-2 py-0.5 rounded-full"
                    >
                      {city}
                    </span>
                  ))}
              </div>
            </button>
            <div className={`expand-container ${isExpanded ? 'expanded' : ''}`}>
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
          </div>
        )
      })}
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-ash" />
        </div>
      )}
      {!hasMore && total > PAGE_SIZE && (
        <p className="text-center text-xs text-ash py-4">已全部加载</p>
      )}
    </div>
  )
}

function CommunityCardInline({
  community,
  recommended,
}: {
  community: Community
  recommended?: boolean
}) {
  return (
    <CommunityCard
      community={{
        id: community.id,
        slug: community.slug,
        name: community.name,
        city: community.city,
        district: community.district ?? undefined,
        description: community.description,
        address: community.address,
        operator: community.operator ?? undefined,
        totalWorkstations: community.totalWorkstations ?? undefined,
        benefits: community.benefits,
        featured: community.featured,
        coverImage: community.coverImage ?? undefined,
        entryFriendly: community.entryFriendly ?? undefined,
      }}
      recommended={recommended}
    />
  )
}
