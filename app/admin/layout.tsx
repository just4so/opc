import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireStaffContext } from '@/lib/admin'
import { Badge } from '@/components/ui/badge'
import { AdminNav } from './admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const staff = await requireStaffContext()
  const isAdmin = staff.role === 'ADMIN'
  const isModerator = staff.role === 'MODERATOR'
  const isCityManager = staff.role === 'CITY_MANAGER'

  const roleLabel = isAdmin ? '管理员' : isModerator ? '版主' : '城市主理人'

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
              {roleLabel}
            </Badge>
            <span className="font-medium">{staff.name || staff.username}</span>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="w-56 bg-white border-r min-h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto">
          <AdminNav
            isCityManager={isCityManager}
            managerScope={staff.managerScope}
          />
        </aside>

        <main className="flex-1 ml-56 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
