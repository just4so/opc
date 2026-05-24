import { Users, FileText, Briefcase, MapPin, Newspaper, TrendingUp, Star, PenLine, ScrollText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/db'
import { TrendChart } from '@/components/admin/trend-chart'
import Link from 'next/link'
import { PhoneForwarded, MapPinned, ShieldCheck, UserPlus } from 'lucide-react'

async function getStats() {
  const [users, posts, orders, communities, news, policies] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.project.count({
      where: { status: 'PUBLISHED', contentType: { in: ['DEMAND', 'COOPERATION'] } },
    }),
    prisma.community.count({ where: { status: 'ACTIVE' } }),
    prisma.news.count(),
    prisma.policy.count({ where: { status: { not: 'EXPIRED' } } }),
  ])

  // 原创资讯 & 精华帖
  const [originalNews, pinnedPosts, policyCities] = await Promise.all([
    prisma.news.count({ where: { isOriginal: true } }),
    prisma.post.count({ where: { pinned: true, status: 'PUBLISHED' } }),
    prisma.policy.groupBy({
      by: ['city'],
      where: { city: { not: null }, status: { not: 'EXPIRED' } },
    }),
  ])

  // 今日新增
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const [todayUsers, todayPosts, todayInquiries, pendingClaims, pendingVerifications, weeklyNewUsers] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count({ where: { createdAt: { gte: today }, status: 'PUBLISHED' } }),
    prisma.inquiry.count({ where: { createdAt: { gte: today } } }),
    prisma.communityClaim.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { showInPlaza: true, verified: false } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
  ])

  return { users, posts, orders, communities, news, policies, policyCities: policyCities.length, todayUsers, todayPosts, originalNews, pinnedPosts, todayInquiries, pendingClaims, pendingVerifications, weeklyNewUsers }
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
    {
      title: '政策总数',
      value: stats.policies,
      icon: ScrollText,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      extra: `覆盖 ${stats.policyCities} 个城市`,
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">仪表盘</h1>

      {/* 运营概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/admin/inquiries" className="block">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PhoneForwarded className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-orange-600/80">今日意向</p>
                <p className="text-2xl font-bold text-orange-700">{stats.todayInquiries}</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/communities" className="block">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPinned className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600/80">待处理认领</p>
                <p className="text-2xl font-bold text-blue-700">{stats.pendingClaims}</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/verify" className="block">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-purple-600/80">待认证用户</p>
                <p className="text-2xl font-bold text-purple-700">{stats.pendingVerifications}</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/users" className="block">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600/80">本周新注册</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.weeklyNewUsers}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

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
