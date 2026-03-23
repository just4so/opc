import { Users, FileText, Briefcase, MapPin, Newspaper, TrendingUp, Star, PenLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/db'
import { TrendChart } from '@/components/admin/trend-chart'

async function getStats() {
  const [users, posts, orders, communities, news] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.project.count({
      where: { status: 'PUBLISHED', contentType: { in: ['DEMAND', 'COOPERATION'] } },
    }),
    prisma.community.count({ where: { status: 'ACTIVE' } }),
    prisma.news.count(),
  ])

  // 原创资讯 & 精华帖
  const [originalNews, pinnedPosts] = await Promise.all([
    prisma.news.count({ where: { isOriginal: true } }),
    prisma.post.count({ where: { pinned: true, status: 'PUBLISHED' } }),
  ])

  // 今日新增
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayUsers, todayPosts] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count({ where: { createdAt: { gte: today }, status: 'PUBLISHED' } }),
  ])

  return { users, posts, orders, communities, news, todayUsers, todayPosts, originalNews, pinnedPosts }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    {
      title: '用户总数',
      value: stats.users,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      extra: `今日新增 ${stats.todayUsers}`,
    },
    {
      title: '动态总数',
      value: stats.posts,
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-50',
      extra: `精华 ${stats.pinnedPosts} · 今日 +${stats.todayPosts}`,
    },
    {
      title: '订单总数',
      value: stats.orders,
      icon: Briefcase,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: '社区总数',
      value: stats.communities,
      icon: MapPin,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: '资讯总数',
      value: stats.news,
      icon: Newspaper,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      extra: `原创 ${stats.originalNews}`,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-secondary mt-1">
                    {card.value.toLocaleString()}
                  </p>
                  {card.extra && (
                    <p className="text-xs text-gray-400 mt-1">{card.extra}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            快捷操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/users"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <span className="text-sm font-medium">管理用户</span>
            </a>
            <a
              href="/admin/posts"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <span className="text-sm font-medium">管理动态</span>
            </a>
            <a
              href="/admin/orders"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <Briefcase className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <span className="text-sm font-medium">管理订单</span>
            </a>
            <a
              href="/admin/communities"
              className="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors"
            >
              <MapPin className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <span className="text-sm font-medium">管理社区</span>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* 近7日趋势 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            近7日趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart />
        </CardContent>
      </Card>
    </div>
  )
}
