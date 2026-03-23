'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Eye, EyeOff, Star, StarOff, Trash2, Search, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  name: string
  tagline: string
  contentType: string
  status: string
  featured: boolean
  viewCount: number
  createdAt: string
  owner: {
    username: string
    name: string | null
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'HIDDEN', label: '已隐藏' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'ARCHIVED', label: '已归档' },
]

const TYPE_OPTIONS = [
  { value: 'DEMAND', label: '需求订单' },
  { value: 'COOPERATION', label: '合作需求' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('contentType', typeFilter)

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setPagination(data.pagination || null)
      }
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, search, statusFilter, typeFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  const handleFeaturedToggle = async (orderId: string, currentFeatured: boolean) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !currentFeatured }),
      })

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('更新推荐状态失败:', error)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('确定要删除这个订单吗？')) return

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleExport = () => {
    window.open('/api/admin/export?type=orders', '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">订单管理</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出数据
        </Button>
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
                  placeholder="搜索标题、描述..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button type="submit">搜索</Button>
            </form>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">全部类型</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            订单列表
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
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">标题</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">发布者</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">推荐</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">浏览</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">发布时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium line-clamp-1">{order.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{order.tagline}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {order.contentType === 'DEMAND' ? '需求订单' : '合作需求'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {order.owner.name || order.owner.username}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            order.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'HIDDEN'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {order.status === 'PUBLISHED'
                            ? '已发布'
                            : order.status === 'HIDDEN'
                            ? '已隐藏'
                            : order.status === 'ARCHIVED'
                            ? '已归档'
                            : order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleFeaturedToggle(order.id, order.featured)}
                          className={order.featured ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          {order.featured ? <Star className="h-5 w-5 fill-current" /> : <StarOff className="h-5 w-5" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.viewCount}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'yyyy-MM-dd')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'PUBLISHED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'HIDDEN')}
                              title="隐藏"
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          {order.status === 'HIDDEN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'PUBLISHED')}
                              title="显示"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(order.id)}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
