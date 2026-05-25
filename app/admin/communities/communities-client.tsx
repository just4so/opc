'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Star, StarOff, Plus, Eye, Pencil, Trash2, Search, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Community {
  id: string
  name: string
  city: string
  district: string | null
  operator: string | null
  status: string
  featured: boolean
  entryFriendly: number | null
  totalWorkstations: number | null
  _count?: { claims: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '运营中', color: 'bg-green-100 text-green-800' },
  { value: 'PENDING', label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'INACTIVE', label: '已停用', color: 'bg-gray-100 text-gray-800' },
]

export default function CommunitiesClient() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'list' | 'claims'>(
    searchParams.get('tab') === 'claims' ? 'claims' : 'list'
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">社区管理</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          社区列表
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'claims'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          认领与收录
        </button>
      </div>

      {activeTab === 'list' ? <CommunityListTab /> : <ClaimsTab />}
    </div>
  )
}

function CommunityListTab() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [cities, setCities] = useState<string[]>([])

  const fetchCommunities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (cityFilter) params.set('city', cityFilter)

      const res = await fetch(`/api/admin/communities?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCommunities(data.communities || [])
        setPagination(data.pagination || null)
      }
    } catch (error) {
      console.error('获取社区失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setCities(data.cityCounts?.map((c: { city: string }) => c.city) || [])
      }
    } catch (error) {
      console.error('获取城市列表失败:', error)
    }
  }

  useEffect(() => {
    fetchCities()
  }, [])

  useEffect(() => {
    fetchCommunities()
  }, [page, search, statusFilter, cityFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleStatusChange = async (communityId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchCommunities()
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleFeaturedToggle = async (communityId: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !currentFeatured }),
      })

      if (res.ok) {
        fetchCommunities()
      }
    } catch (error) {
      console.error('更新推荐状态失败:', error)
    }
  }

  const handleDelete = async (communityId: string, name: string) => {
    if (!confirm(`确定要删除社区 "${name}" 吗？此操作不可恢复。`)) return

    try {
      const res = await fetch(`/api/admin/communities/${communityId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchCommunities()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleExport = () => {
    window.open('/api/admin/export?type=communities', '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Link href="/admin/communities/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建社区
            </Button>
          </Link>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[200px]">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索社区名称、地址、运营方..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button type="submit">搜索</Button>
            </form>

            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">全部城市</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            社区列表
            {pagination && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (共 {pagination.total} 个)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : communities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无社区</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">城市</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">运营方</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">推荐</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">入驻友好度</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">工位数</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">认领</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((community) => {
                    const statusOption = STATUS_OPTIONS.find(
                      (s) => s.value === community.status
                    )
                    return (
                      <tr key={community.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{community.name}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {community.city}
                          {community.district && ` · ${community.district}`}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {community.operator || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={community.status}
                            onChange={(e) =>
                              handleStatusChange(community.id, e.target.value)
                            }
                            className={`text-xs px-2 py-1 rounded ${statusOption?.color || 'bg-gray-100'}`}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              handleFeaturedToggle(community.id, community.featured)
                            }
                            className={
                              community.featured ? 'text-yellow-500' : 'text-gray-300'
                            }
                          >
                            {community.featured ? (
                              <Star className="h-5 w-5 fill-current" />
                            ) : (
                              <StarOff className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {community.entryFriendly ? (
                            <span className="text-yellow-500">
                              {'★'.repeat(Math.min(community.entryFriendly, 5))}
                              {'☆'.repeat(Math.max(0, 5 - community.entryFriendly))}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                          <div className="text-[11px] text-gray-400 mt-1">入驻友好度</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {community.totalWorkstations || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {(community._count?.claims ?? 0) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {community._count!.claims}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/communities/${community.id}`}>
                              <Button variant="ghost" size="sm" title="查看">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/communities/${community.id}/edit`}>
                              <Button variant="ghost" size="sm" title="编辑">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(community.id, community.name)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                第 {page} / {pagination.totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface CommunityClaim {
  id: string
  type: string
  communityName: string
  contactName: string
  contactInfo: string
  city: string | null
  description: string | null
  status: string
  createdAt: string
  community: { name: string; slug: string } | null
}

const CLAIM_STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'PENDING' },
  { label: '已联系', value: 'CONTACTED' },
  { label: '已完成', value: 'COMPLETED' },
]

const CLAIM_STATUS_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: 'PENDING', label: '待处理', className: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONTACTED', label: '已联系', className: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: '已完成', className: 'bg-green-100 text-green-800' },
]

function ClaimsTab() {
  const [claims, setClaims] = useState<CommunityClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/community-claims?${params}`)
      if (res.ok) {
        const data = await res.json()
        setClaims(data.claims || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/community-claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        await fetchClaims()
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div>
      {/* Sub-filter tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {CLAIM_STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">类型</th>
                <th className="pb-3 pr-4 font-medium">社区名称</th>
                <th className="pb-3 pr-4 font-medium">联系人</th>
                <th className="pb-3 pr-4 font-medium">联系方式</th>
                <th className="pb-3 pr-4 font-medium">城市</th>
                <th className="pb-3 pr-4 font-medium">说明</th>
                <th className="pb-3 pr-4 font-medium">状态</th>
                <th className="pb-3 font-medium">提交时间</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => {
                const statusOpt = CLAIM_STATUS_OPTIONS.find((s) => s.value === claim.status)
                return (
                  <tr key={claim.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <Badge className={claim.type === 'CLAIM' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                        {claim.type === 'CLAIM' ? '认领' : '收录'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {claim.community?.name || claim.communityName}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{claim.contactName}</td>
                    <td className="py-3 pr-4 text-gray-600">{claim.contactInfo}</td>
                    <td className="py-3 pr-4 text-gray-600">{claim.city || '-'}</td>
                    <td className="py-3 pr-4 text-gray-600 max-w-[160px] truncate">
                      {claim.description || '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={claim.status}
                        disabled={updating === claim.id}
                        onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${statusOpt?.className || 'bg-gray-100'}`}
                      >
                        {CLAIM_STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(claim.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
