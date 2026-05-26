import Link from 'next/link'
import { PhoneForwarded, MapPinned, ShieldCheck, UserPlus, FileText, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/db'
import { ActivityFeed } from '@/components/admin/activity-feed'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    pendingInquiries,
    pendingClaims,
    pendingVerifications,
    todayUsers,
    todayInquiries,
    todayPosts,
    todayClaims,
  ] = await Promise.all([
    prisma.inquiry.count({ where: { status: 'PENDING' } }),
    prisma.communityClaim.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { showInPlaza: true, verified: false } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.inquiry.count({ where: { createdAt: { gte: today } } }),
    prisma.post.count({ where: { createdAt: { gte: today }, status: 'PUBLISHED' } }),
    prisma.communityClaim.count({ where: { createdAt: { gte: today } } }),
  ])

  return {
    pendingInquiries,
    pendingClaims,
    pendingVerifications,
    todayUsers,
    todayInquiries,
    todayPosts,
    todayClaims,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const todos = [
    {
      label: '待跟进意向',
      count: data.pendingInquiries,
      href: '/admin/inquiries?status=PENDING',
      icon: PhoneForwarded,
      iconColor: 'text-orange-600',
      labelColor: 'text-orange-600/80',
      countColor: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: '待处理认领',
      count: data.pendingClaims,
      href: '/admin/communities?tab=claims',
      icon: MapPinned,
      iconColor: 'text-blue-600',
      labelColor: 'text-blue-600/80',
      countColor: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: '待认证用户',
      count: data.pendingVerifications,
      href: '/admin/verify',
      icon: ShieldCheck,
      iconColor: 'text-purple-600',
      labelColor: 'text-purple-600/80',
      countColor: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ]

  const hasTodos = todos.some(t => t.count > 0)

  const todayStats = [
    { label: '新注册', value: data.todayUsers, icon: UserPlus },
    { label: '新意向', value: data.todayInquiries, icon: PhoneForwarded },
    { label: '新帖子', value: data.todayPosts, icon: FileText },
    { label: '新认领', value: data.todayClaims, icon: MapPinned },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">运营工作台</h1>

      {/* 第一层：待办事项 */}
      <div className="mb-6">
        {hasTodos ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {todos.filter(t => t.count > 0).map(todo => (
              <Link key={todo.label} href={todo.href} className="block">
                <div className={`${todo.bg} border ${todo.border} rounded-xl p-4 hover:shadow-sm transition-shadow`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${todo.bg} rounded-lg`}>
                      <todo.icon className={`h-5 w-5 ${todo.iconColor}`} />
                    </div>
                    <div>
                      <p className={`text-xs ${todo.labelColor}`}>{todo.label}</p>
                      <p className={`text-2xl font-bold ${todo.countColor}`}>{todo.count}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            当前没有待处理事项
          </div>
        )}
      </div>

      {/* 第二层：今日动态 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {todayStats.map(stat => (
          <div key={stat.label} className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <stat.icon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-700">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 第三层：最近活动流 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近活动</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>
    </div>
  )
}
