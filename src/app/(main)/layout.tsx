import Link from 'next/link'
import { UserNav } from '@/components/layout/user-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">OPC</span>
            <span className="text-xl font-semibold text-secondary">创业圈</span>
          </Link>

          {/* 导航链接 */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/communities"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              社区地图
            </Link>
            <Link
              href="/plaza"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              创业广场
            </Link>
            <Link
              href="/projects"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              项目展示
            </Link>
          </nav>

          {/* 用户操作 */}
          <UserNav />
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 底部 */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2026 OPC创业圈. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/about" className="text-sm text-gray-500 hover:text-primary">
                关于我们
              </Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-primary">
                联系方式
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary">
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
