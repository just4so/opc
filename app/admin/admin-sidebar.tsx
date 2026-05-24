'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminSidebarLink({ href, label, children }: { href: string; label: string; children?: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
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

export function AdminSidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="px-4 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}
