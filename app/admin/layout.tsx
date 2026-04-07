import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  MapPin,
  Newspaper,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import { requireStaff } from '@/lib/admin'
import { Badge } from '@/components/ui/badge'
import { AdminSidebarLink } from './admin-sidebar'

const NAV_ITEMS = [
  { href: '/admin', label: '仪表盘', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/users', label: '用户管理', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/posts', label: '动态管理', icon: <FileText className="h-5 w-5" /> },
  { href: '/admin/orders', label: '合作管理', icon: <Briefcase className="h-5 w-5" /> },
  { href: '/admin/communities', label: '社区管理', icon: <MapPin className="h-5 w-5" /> },
  { href: '/admin/news', label: '资讯管理', icon: <Newspaper className="h-5 w-5" /> },
  { href: '/admin/settings', label: '系统设置', icon: <Settings className="h-5 w-5" /> },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const staff = await requireStaff()
  const isAdmin = staff.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部栏 */}
      <header className="bg-white border-b h-16 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回前台
            </Link>
            <span className="text-xl font-bold text-secondary">管理后台</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {isAdmin ? '管理员' : '版主'}
            </Badge>
            <span className="font-medium">{staff.name || staff.username}</span>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* 侧边栏 — icon 在 Server Component 渲染，只传 href/label 给 Client */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] fixed left-0 top-16">
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <AdminSidebarLink key={item.href} href={item.href} label={item.label}>
                {item.icon}
              </AdminSidebarLink>
            ))}
          </nav>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
