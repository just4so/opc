'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  iconName: string  // 用字符串传递，避免把函数传给 Client Component
}

// icon 在这里渲染，不从 Server Component 传入
const ICON_MAP: Record<string, React.ReactNode> = {}

export function AdminSidebarLink({ href, label, children }: { href: string; label: string; children?: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
      }`}
    >
      {children}
      <span>{label}</span>
    </Link>
  )
}
