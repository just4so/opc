import Link from 'next/link'
import { Search } from 'lucide-react'
import { UserNav } from '@/components/layout/user-nav'
import { NavLinks } from '@/components/layout/nav-links'
import { MobileMenu } from '@/components/layout/mobile-menu'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 顶部导航 - 玻璃态效果 */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 glass-strong">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-bold text-primary group-hover:text-primary-600 transition-colors">OPC</span>
            <span className="text-xl font-semibold text-secondary">圈</span>
          </Link>

          {/* 导航链接 */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </nav>

          {/* 用户操作 */}
          <div className="flex items-center space-x-2">
            <Link
              href="/search"
              className="p-2.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
              title="搜索"
            >
              <Search className="h-5 w-5" />
            </Link>
            <div className="hidden md:flex">
              <UserNav />
            </div>
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">OPC</span>
              <span className="text-lg font-semibold text-secondary">圈</span>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/about" className="text-sm text-gray-500 hover:text-primary transition-colors">
                关于我们
              </Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-primary transition-colors">
                联系方式
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary transition-colors">
                隐私政策
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              © 2026 OPC圈
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
