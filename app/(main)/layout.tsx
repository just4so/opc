import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { UserNav } from '@/components/layout/user-nav'
import { NavLinks } from '@/components/layout/nav-links'
import { MobileMenu } from '@/components/layout/mobile-menu'
import { ScrollHeader } from '@/components/layout/scroll-header'
import { ToastProvider } from '@/components/ui/toast-notification'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 顶部导航 - 滚动感知 */}
      <ScrollHeader>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo-wordmark.png"
              alt="OPC圈"
              width={150}
              height={30}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          {/* 导航链接 */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavLinks />
          </nav>

          {/* 用户操作 */}
          <div className="flex items-center space-x-2">
            <Link
              href="/search"
              className="p-2.5 text-ash hover:text-primary hover:bg-surface-soft rounded-lg transition-all"
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
      </ScrollHeader>

      {/* 主内容区 */}
      <main className="flex-1">
        <ToastProvider>
          {children}
        </ToastProvider>
      </main>

      {/* 底部 */}
      <footer className="border-t border-hairline-soft bg-surface-dark py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center">
              <Image
                src="/logo-wordmark-white.png"
                alt="OPC圈"
                width={120}
                height={24}
                className="h-6 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col items-center gap-2 md:flex-1">
              <div className="flex items-center space-x-8">
                <Link href="/about" className="text-sm text-on-dark-mute hover:text-on-dark transition-colors">
                  关于我们
                </Link>
                <Link href="/faq" className="text-sm text-on-dark-mute hover:text-on-dark transition-colors">
                  常见问题
                </Link>
                <Link href="/contact" className="text-sm text-on-dark-mute hover:text-on-dark transition-colors">
                  联系方式
                </Link>
                <Link href="/privacy" className="text-sm text-on-dark-mute hover:text-on-dark transition-colors">
                  隐私政策
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://beian.miit.gov.cn"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-on-dark-mute hover:text-on-dark transition-colors"
                >
                  京ICP备2025122039号-2
                </a>
                <a
                  href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11011502039750"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-on-dark-mute hover:text-on-dark transition-colors"
                >
                  <img src="/beian-icon.png" alt="公安备案" width={14} height={14} />
                  京公网安备11011502039750号
                </a>
              </div>
            </div>
            <div className="text-sm text-on-dark-mute md:text-right">
              © 2026 OPC圈
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
