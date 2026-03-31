'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Settings, ChevronDown, Shield, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UserNav() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    if (status !== 'authenticated' || !session?.user) return

    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [session, status])

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/conversations/unread')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('获取未读数失败:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          注册
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden">
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
            ) : (
              <span>{session.user.name?.[0] || session.user.email?.[0] || 'U'}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {unreadCount > 9 ? '!' : unreadCount}
            </span>
          )}
        </div>
        <span className="hidden md:block max-w-[100px] truncate">
          {session.user.name || session.user.email}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name || '用户'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4 mr-2" />
              个人中心
            </Link>
            <Link
              href="/messages"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              私信
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Link>
            {((session.user as any).role === 'ADMIN' || (session.user as any).role === 'MODERATOR') && (
              <Link
                href="/admin"
                className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                onClick={() => setIsOpen(false)}
              >
                <Shield className="h-4 w-4 mr-2" />
                管理后台
              </Link>
            )}
            <button
              onClick={() => {
                setIsOpen(false)
                signOut({ callbackUrl: '/' })
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  )
}
