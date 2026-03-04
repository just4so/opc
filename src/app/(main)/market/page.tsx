import Link from 'next/link'
import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { OrderCard } from '@/components/market/order-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { CONTENT_TYPES, MARKET_CATEGORIES, BUDGET_TYPES } from '@/constants/topics'

// ISR: 每5分钟重新生成页面
export const revalidate = 300

export const metadata: Metadata = {
  title: '合作广场 - OPC创业圈',
  description: '发布需求、寻找合作，连接商家与OPC创业者',
}

interface PageProps {
  searchParams: { type?: string; category?: string; page?: string }
}

async function getOrders(type?: string, category?: string, page: number = 1) {
  const limit = 12
  const where: any = {
    status: 'PUBLISHED',
    contentType: {
      in: ['DEMAND', 'COOPERATION'],
    },
  }

  if (type && (type === 'DEMAND' || type === 'COOPERATION')) {
    where.contentType = type
  }

  if (category) {
    where.category = { has: category }
  }

  const [orders, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ])

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export default async function MarketPage({ searchParams }: PageProps) {
  const type = searchParams.type
  const category = searchParams.category
  const page = parseInt(searchParams.page || '1')
  const { orders, pagination } = await getOrders(type, category, page)

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
        {orders.length > 0 ? (
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
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/market?${type ? `type=${type}&` : ''}${category ? `category=${category}&` : ''}page=${p}`}
                className={`px-4 py-2 rounded-md text-sm ${
                  p === page
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
