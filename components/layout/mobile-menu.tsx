'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut, Shield, MessageSquare, Map, MapPin, MessageCircle, Radio, Newspaper } from 'lucide-react'
import { useUnread } from './unread-provider'

const navLinks = [
  { href: '/communities', label: '社区', icon: Map },
  { href: '/plaza', label: '广场', icon: MessageCircle },
  { href: '/news', label: '洞察', icon: Newspaper },
  { href: '/radar', label: '雷达', icon: Radio },
  { href: '/local', label: '同城', icon: MapPin },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { counts } = useUnread()

  const close = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        className="md:hidden p-2 text-mute hover:text-primary hover:bg-surface-card rounded-2xl transition-all"
        onClick={() => setIsOpen(true)}
        aria-label="打开菜单"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay + drawer — rendered via Portal to escape header's backdrop-filter stacking context */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/40"
            onClick={close}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 z-[200] h-full w-72 bg-canvas shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-soft">
              <span className="text-lg font-bold text-primary">OPC<span className="text-ink font-semibold">圈</span></span>
              <button
                onClick={close}
                className="p-2 text-ash hover:text-mute hover:bg-surface-card rounded-2xl transition-all"
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
                        ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-primary bg-orange-50'
                        : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-charcoal hover:text-primary hover:bg-orange-50 transition-colors'
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Auth section */}
            <div className="border-t border-hairline-soft px-4 py-4">
              {status === 'loading' ? (
                <div className="h-10 bg-surface-card rounded animate-pulse" />
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
                      <p className="text-sm font-medium text-ink truncate">{session.user.name || '用户'}</p>
                      <p className="text-xs text-mute truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <Link href="/settings" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-charcoal hover:bg-surface-card transition-colors">
                    <User className="h-4 w-4" /> 我的
                  </Link>
                  <Link href="/messages" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-charcoal hover:bg-surface-card transition-colors">
                    <div className="relative">
                      <MessageSquare className="h-4 w-4" />
                      {counts.messages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {counts.messages > 9 ? '!' : counts.messages}
                        </span>
                      )}
                    </div>
                    私信
                    {counts.messages > 0 && (
                      <span className="ml-auto text-xs text-red-500 font-medium">{counts.messages}</span>
                    )}
                  </Link>
                  {((session.user as any).role === 'ADMIN' || (session.user as any).role === 'MODERATOR' || (session.user as any).role === 'CITY_MANAGER') && (
                    <Link href="/admin" onClick={close} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                      <Shield className="h-4 w-4" /> 管理后台
                    </Link>
                  )}
                  <button
                    onClick={() => { close(); signOut({ callbackUrl: '/' }) }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> 退出登录
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={close}
                    className="block text-center px-4 py-2.5 rounded-2xl text-sm font-medium text-charcoal border border-hairline-soft hover:border-primary hover:text-primary transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={close}
                    className="block text-center px-4 py-2.5 rounded-2xl text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      , document.body)}
    </>
  )
}
