import Link from 'next/link'
import { Plus, Briefcase, Handshake, Share2 } from 'lucide-react'
import { OrderCard } from '@/components/market/order-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPES, MARKET_CATEGORIES } from '@/constants/topics'
import prisma from '@/lib/db'

export const revalidate = 120

const PAGE_SIZE = 20

export default async function MarketPage({
  searchParams,
}: {
  searchParams: { type?: string; category?: string; page?: string }
}) {
  const type = searchParams.type || ''
  const category = searchParams.category || ''
  const page = parseInt(searchParams.page || '1') || 1

  const where: any = {
    status: 'PUBLISHED',
    contentType: { in: ['DEMAND', 'COOPERATION'] },
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
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

  const totalPages = Math.ceil(total / PAGE_SIZE)

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

      {/* CTA 引导条 */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-700 font-medium">
              有合作需求？发布后可被500+创业者看到
            </p>
            <div className="flex gap-2">
              <Link href="/market/new?type=DEMAND">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                  发布需求
                </Button>
              </Link>
              <Link href="/market/new?type=COOPERATION">
                <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                  <Handshake className="h-3.5 w-3.5 mr-1.5" />
                  发布项目
                </Button>
              </Link>
              <Link href="/market/new?type=COOPERATION">
                <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  分享资源
                </Button>
              </Link>
            </div>
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
                'comingSoon' in t && t.comingSoon ? (
                  <Badge
                    key={t.id}
                    variant="outline"
                    className="cursor-not-allowed opacity-60"
                    style={{ borderColor: t.color, color: t.color }}
                  >
                    {t.name}
                    <span className="ml-1 text-[10px]">即将上线</span>
                  </Badge>
                ) : (
                  <Link key={t.id} href={`/market?type=${t.id}`}>
                    <Badge
                      variant={type === t.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={type === t.id ? {} : { borderColor: t.color, color: t.color }}
                    >
                      {t.name}
                    </Badge>
                  </Link>
                )
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
              <OrderCard key={order.id} order={{
                ...order,
                deadline: order.deadline,
                createdAt: order.createdAt,
              }} />
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
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
