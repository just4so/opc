'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, StarOff, Plus, Eye, Pencil, Trash2, Search, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Community {
  id: string
  name: string
  city: string
  district: string | null
  operator: string | null
  status: string
  featured: boolean
  applyDifficulty: number | null
  workstations: number | null
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">社区管理</h1>
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
                          {community.applyDifficulty ? (
                            <span className="text-yellow-500">
                              {'★'.repeat(community.applyDifficulty)}
                              {'☆'.repeat(5 - community.applyDifficulty)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                          <div className="text-[11px] text-gray-400 mt-1">入驻友好度</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {community.workstations || '-'}
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
