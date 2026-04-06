'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut, Settings, Shield, MessageSquare, Map, MessageCircle, Newspaper, Wrench } from 'lucide-react'

const navLinks = [
  { href: '/communities', label: '社区地图', icon: Map },
  { href: '/plaza', label: '交流广场', icon: MessageCircle },
  { href: '/news', label: '创业资讯', icon: Newspaper },
  { href: '/tools', label: '工具导航', icon: Wrench },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const close = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        className="md:hidden p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-all"
        onClick={() => setIsOpen(true)}
        aria-label="打开菜单"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay + drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={close}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-lg font-bold text-primary">OPC<span className="text-secondary font-semibold">圈</span></span>
              <button
                onClick={close}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                aria-label="关闭菜单"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className={
                      isActive
                        ? 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary bg-orange-50'
                        : 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-primary hover:bg-orange-50 transition-colors'
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Auth section */}
            <div className="border-t border-gray-100 px-4 py-4">
              {status === 'loading' ? (
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              ) : session?.user ? (
                <div className="space-y-1">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0 overflow-hidden">
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
                      ) : (
                        <span>{session.user.name?.[0] || session.user.email?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || '用户'}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <Link href="/profile" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <User className="h-4 w-4" /> 个人中心
                  </Link>
                  <Link href="/messages" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <MessageSquare className="h-4 w-4" /> 私信
                  </Link>
                  <Link href="/settings" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <Settings className="h-4 w-4" /> 设置
                  </Link>
                  {((session.user as any).role === 'ADMIN' || (session.user as any).role === 'MODERATOR') && (
                    <Link href="/admin" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                      <Shield className="h-4 w-4" /> 管理后台
                    </Link>
                  )}
                  <button
                    onClick={() => { close(); signOut({ callbackUrl: '/' }) }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> 退出登录
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={close}
                    className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:border-primary hover:text-primary transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={close}
                    className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
