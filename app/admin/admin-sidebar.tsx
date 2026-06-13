'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function AdminSidebarLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href.split('?')[0])

  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className="shrink-0 opacity-70">{children}</span>
      <span>{label}</span>
    </Link>
  )
}

/** 静态分组标题（高频区，不可折叠） */
export function AdminSidebarGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4">
      <div className="px-3 mb-1 text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/** 可折叠分组（低频区），localStorage 记忆展开状态 */
export function AdminSidebarCollapsible({
  label,
  storageKey,
  defaultOpen = false,
  activePrefixes = [],
  children,
}: {
  label: string
  storageKey: string
  defaultOpen?: boolean
  /** 该分组内所有路由前缀，命中时自动展开 */
  activePrefixes?: string[]
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 当前路径是否命中该分组
  const isGroupActive = activePrefixes.some((prefix) => pathname.startsWith(prefix))

  const [open, setOpen] = useState(defaultOpen || isGroupActive)

  // 只在客户端读 localStorage（避免 SSR hydration 不一致）
  useEffect(() => {
    if (isGroupActive) {
      setOpen(true)
      return
    }
    const stored = localStorage.getItem(`sidebar_${storageKey}`)
    if (stored !== null) {
      setOpen(stored === 'true')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(`sidebar_${storageKey}`, String(next)) } catch {}
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 tracking-widest uppercase hover:bg-gray-50 hover:text-gray-600 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-0.5 mt-0.5">{children}</div>
      </div>
    </div>
  )
}
