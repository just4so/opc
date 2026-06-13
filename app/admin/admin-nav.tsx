'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, FileText, Briefcase, MapPin,
  Newspaper, Settings, Radio, ScrollText, PhoneForwarded,
  ShieldCheck, UserCheck, ClipboardList, Building2, ChevronDown,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ReactNode }

const DATA_ITEMS: NavItem[] = [
  { href: '/admin/communities', label: '社区管理', icon: <MapPin className="h-4 w-4" /> },
  { href: '/admin/inquiries',   label: '意向管理', icon: <PhoneForwarded className="h-4 w-4" /> },
  { href: '/admin/policies',    label: '政策管理', icon: <ScrollText className="h-4 w-4" /> },
]
const CONTENT_ITEMS: NavItem[] = [
  { href: '/admin/posts',  label: '动态管理', icon: <FileText className="h-4 w-4" /> },
  { href: '/admin/news',   label: '资讯管理', icon: <Newspaper className="h-4 w-4" /> },
  { href: '/admin/radar',  label: '雷达管理', icon: <Radio className="h-4 w-4" /> },
]
const USER_ITEMS: NavItem[] = [
  { href: '/admin/users',                  label: '用户管理', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/verify',                 label: '认证管理', icon: <ShieldCheck className="h-4 w-4" /> },
  { href: '/admin/managers',               label: '主理人管理', icon: <UserCheck className="h-4 w-4" /> },
  { href: '/admin/communities?tab=claims', label: '社区认领',  icon: <Building2 className="h-4 w-4" /> },
]
const SYSTEM_ITEMS: NavItem[] = [
  { href: '/admin/orders',   label: '项目管理', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/admin/logs',     label: '操作日志', icon: <ClipboardList className="h-4 w-4" /> },
  { href: '/admin/settings', label: '站点设置', icon: <Settings className="h-4 w-4" /> },
]
const CITY_MANAGER_SYSTEM_ITEMS: NavItem[] = [
  { href: '/admin/logs', label: '操作日志', icon: <ClipboardList className="h-4 w-4" /> },
]

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname()
  const isActive = href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(href.split('?')[0])
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className="shrink-0 opacity-60">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div className="mt-4">
      <div className="px-3 mb-1 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => <NavLink key={item.href} {...item} />)}
      </div>
    </div>
  )
}

function NavCollapsible({
  label,
  storageKey,
  items,
  activePrefixes,
}: {
  label: string
  storageKey: string
  items: NavItem[]
  activePrefixes: string[]
}) {
  const pathname = usePathname()
  const isGroupActive = activePrefixes.some((p) => pathname.startsWith(p))
  const [open, setOpen] = useState(isGroupActive)

  useEffect(() => {
    if (isGroupActive) { setOpen(true); return }
    try {
      const stored = localStorage.getItem(`sidebar_${storageKey}`)
      if (stored !== null) setOpen(stored === 'true')
    } catch {}
  }, []) // eslint-disable-line

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      try { localStorage.setItem(`sidebar_${storageKey}`, String(next)) } catch {}
      return next
    })
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-semibold text-gray-400 tracking-widest uppercase hover:bg-gray-50 hover:text-gray-600 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {items.map((item) => <NavLink key={item.href} {...item} />)}
        </div>
      )}
    </div>
  )
}

export function AdminNav({
  isCityManager,
  managerScope,
}: {
  isCityManager: boolean
  managerScope?: { scope: 'CITY' | 'PROVINCE'; city?: string | null; province: string } | null
}) {
  return (
    <nav className="px-3 py-4">
      {/* 仪表盘 */}
      <NavLink href="/admin" label="仪表盘" icon={<LayoutDashboard className="h-4 w-4" />} />

      {/* 城市主理人管辖范围 */}
      {isCityManager && managerScope && (
        <div className="px-3 py-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg mt-2">
          管辖：{managerScope.scope === 'CITY' ? managerScope.city : managerScope.province + '（省级）'}
        </div>
      )}

      <div className="my-3 border-t border-gray-100" />

      {/* 高频区 */}
      <NavGroup label="数据管理" items={DATA_ITEMS} />
      {!isCityManager && <NavGroup label="内容管理" items={CONTENT_ITEMS} />}

      <div className="my-3 border-t border-gray-100" />

      {/* 低频区 */}
      {isCityManager ? (
        <NavGroup label="系统" items={CITY_MANAGER_SYSTEM_ITEMS} />
      ) : (
        <>
          <NavCollapsible
            label="用户管理"
            storageKey="users"
            items={USER_ITEMS}
            activePrefixes={['/admin/users', '/admin/verify', '/admin/managers']}
          />
          <NavCollapsible
            label="系统"
            storageKey="system"
            items={SYSTEM_ITEMS}
            activePrefixes={['/admin/orders', '/admin/logs', '/admin/settings']}
          />
        </>
      )}
    </nav>
  )
}
