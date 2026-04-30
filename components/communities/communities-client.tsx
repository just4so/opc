'use client'

import { BaiduMap } from '@/components/communities/baidu-map'
import { CommunityCard } from '@/components/communities/community-card'

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
  operator?: string | null
  totalWorkstations?: number | null
  benefits?: any
  featured: boolean
  entryFriendly?: number | null
  coverImage?: string | null
}

interface CommunitiesClientProps {
  communities: Community[]       // 当前页数据（列表用）
  allCommunities: Community[]    // 全量筛选后数据（地图用，显示所有标记）
  selectedCity?: string
  pagination: { page: number; total: number; totalPages: number }
  cityCounts: { city: string; count: number }[]
  viewMode: 'map' | 'list'
  onViewModeChange: (v: 'map' | 'list') => void
  onPageChange: (p: number) => void
}

export function CommunitiesClient({
  communities,
  allCommunities,
  selectedCity,
  pagination,
  viewMode,
  onPageChange,
}: CommunitiesClientProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* 地图视图：用全量数据显示所有标记 */}
      {viewMode === 'map' && (
        <div>
          <BaiduMap
            communities={allCommunities.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              city: c.city,
              address: c.address,
              latitude: c.latitude ?? undefined,
              longitude: c.longitude ?? undefined,
            }))}
            selectedCity={selectedCity}
          />
          <p className="text-xs text-gray-400 text-center mt-3">
            点击橙色标记查看社区 · 切换「列表」浏览全部
          </p>
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <>
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {communities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={{
                    ...community,
                    district: community.district ?? undefined,
                    operator: community.operator ?? undefined,
                    totalWorkstations: community.totalWorkstations ?? undefined,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <p className="text-gray-500 mb-2">暂无社区数据</p>
              <p className="text-sm text-gray-400">
                {selectedCity ? `${selectedCity}暂时没有收录的 OPC 社区` : '请稍后再来查看'}
              </p>
            </div>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
