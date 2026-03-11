'use client'

import { useState } from 'react'
import { BaiduMap } from '@/components/communities/baidu-map'
import { CommunityCard } from '@/components/communities/community-card'
import { Map, List } from 'lucide-react'

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
  spaceSize?: string | null
  workstations?: number | null
  policies?: any
  focus: string[]
  featured: boolean
  applyDifficulty?: number | null
}

interface CommunitiesClientProps {
  communities: Community[]
  selectedCity?: string
  pagination: {
    page: number
    total: number
    totalPages: number
  }
  cityCounts: { city: string; count: number }[]
}

export function CommunitiesClient({
  communities,
  selectedCity,
  pagination,
  cityCounts,
}: CommunitiesClientProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 地图视图切换 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {selectedCity ? `${selectedCity}` : '全部城市'} · 共 {pagination.total} 个社区
        </p>
        <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'map'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Map className="h-4 w-4 mr-1" />
            地图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="h-4 w-4 mr-1" />
            列表
          </button>
        </div>
      </div>

      {/* 地图视图 */}
      {viewMode === 'map' && (
        <div className="mb-8">
          <BaiduMap
            communities={communities.map((c) => ({
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
        </div>
      )}

      {/* 社区卡片网格 */}
      {communities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={{
                ...community,
                district: community.district ?? undefined,
                operator: community.operator ?? undefined,
                spaceSize: community.spaceSize ?? undefined,
                workstations: community.workstations ?? undefined,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg">
          <p className="text-gray-500 mb-4">暂无社区数据</p>
          <p className="text-sm text-gray-400">
            {selectedCity
              ? `${selectedCity}暂时没有收录的OPC社区`
              : '请稍后再来查看'}
          </p>
        </div>
      )}

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <a
                key={p}
                href={`/communities?${
                  selectedCity ? `city=${selectedCity}&` : ''
                }page=${p}`}
                className={`px-4 py-2 rounded-md text-sm ${
                  p === pagination.page
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </a>
            )
          )}
        </div>
      )}
    </div>
  )
}
