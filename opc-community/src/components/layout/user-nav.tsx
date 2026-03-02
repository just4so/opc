'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UserNav() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

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
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {session.user.name?.[0] || session.user.email?.[0] || 'U'}
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
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Link>
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
