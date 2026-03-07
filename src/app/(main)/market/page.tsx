'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { OrderCard } from '@/components/market/order-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPES, MARKET_CATEGORIES } from '@/constants/topics'

interface Order {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  category: string[]
  skills: string[]
  budgetType: string | null
  budgetMin: number | null
  budgetMax: number | null
  deadline: string | null
  contentType: string
  status: string
  featured: boolean
  createdAt: string
  owner: {
    id: string
    username: string
    name: string | null
    avatar: string | null
    verified: boolean
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function MarketContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || ''
  const category = searchParams.get('category') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    params.set('page', String(page))
    params.set('limit', '12')

    fetch(`/api/market?${params}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type, category, page])

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">合作广场</h1>
              <p className="text-gray-600">
                发布需求、寻找合作，连接商家与OPC创业者
              </p>
            </div>
            <Link href="/market/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                发布需求
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 筛选栏 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          {/* 订单类型 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">订单类型</h3>
            <div className="flex flex-wrap gap-2">
              <Link href="/market">
                <Badge
                  variant={!type ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  全部
                </Badge>
              </Link>
              {CONTENT_TYPES.map((t) => (
                <Link key={t.id} href={`/market?type=${t.id}`}>
                  <Badge
                    variant={type === t.id ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={type === t.id ? {} : { borderColor: t.color, color: t.color }}
                  >
                    {t.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* 服务分类 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">服务分类</h3>
            <div className="flex flex-wrap gap-2">
              <Link href={type ? `/market?type=${type}` : '/market'}>
                <Badge
                  variant={!category ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  全部
                </Badge>
              </Link>
              {MARKET_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/market?${type ? `type=${type}&` : ''}category=${c}`}
                >
                  <Badge
                    variant={category === c ? 'default' : 'outline'}
                    className="cursor-pointer"
                  >
                    {c}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 订单网格 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">暂无订单</p>
            <Link href="/market/new">
              <Button>发布第一个需求</Button>
            </Link>
          </div>
        )}

        {/* 分页 */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/market?${type ? `type=${type}&` : ''}${category ? `category=${category}&` : ''}page=${p}`}
                className={`px-4 py-2 rounded-md text-sm ${
                  p === pagination.page
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MarketPage() {
  return (
    <Suspense fallback={null}>
      <MarketContent />
    </Suspense>
  )
}
