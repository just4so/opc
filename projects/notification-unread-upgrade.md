# 通知&私信策略统一 + 轮询优化

> 创建时间：2026-05-25
> 状态：待执行
> 项目路径：/Users/wei/Documents/opc

---

## 背景与目标

### 现状问题
1. **头像角标语义混乱**：私信未读数显示在头像右上角，用户误以为是账号状态问题
2. **两套独立系统并存**：NotificationBell（系统通知）和 UserNav（私信未读）各自独立轮询，每 30 秒各发一次请求，共 2 次/30s
3. **通知面板跳转错误**：INQUIRY_STATUS（意向状态变更）点击后跳到 /messages，应该无跳转或跳意向页面
4. **移动端私信无未读角标**：手机端侧边菜单「私信」链接没有未读数提示
5. **用户切换 Tab 也在轮询**：浏览器后台时仍在消耗请求

### 目标架构
```
导航栏（桌面端）
├── 🔔 铃铛（NotificationBell）—— 系统通知未读角标，点击展开通知面板
├── 💬 私信图标（新增 MessageButton）—— 私信未读角标，点击直跳 /messages
└── 👤 头像（无角标）—— 仅身份标识，点击展开下拉菜单
```

---

## 新增 API

### 新建 `app/api/unread-summary/route.ts`

合并两个接口为一个，减少请求数：

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: 0, messages: 0 })
    }

    const [notificationCount, messageResult] = await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
      prisma.conversationParticipant.aggregate({
        where: { userId: session.user.id },
        _sum: { unreadCount: true },
      }),
    ])

    return NextResponse.json({
      notifications: notificationCount,
      messages: messageResult._sum.unreadCount || 0,
    })
  } catch {
    return NextResponse.json({ notifications: 0, messages: 0 })
  }
}
```

---

## 新增组件

### 新建 `components/layout/unread-provider.tsx`

全局共享未读数状态，避免多个组件各自轮询：

```typescript
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface UnreadCounts {
  notifications: number
  messages: number
}

const UnreadContext = createContext<{
  counts: UnreadCounts
  refresh: () => void
}>({
  counts: { notifications: 0, messages: 0 },
  refresh: () => {},
})

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<UnreadCounts>({ notifications: 0, messages: 0 })

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/unread-summary')
      if (res.ok) {
        const data = await res.json()
        setCounts({ notifications: data.notifications || 0, messages: data.messages || 0 })
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchCounts()

    // Page Visibility API：切 Tab 时暂停轮询，回来立刻刷新
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCounts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCounts()
      }
    }, 30000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchCounts])

  return (
    <UnreadContext.Provider value={{ counts, refresh: fetchCounts }}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnread() {
  return useContext(UnreadContext)
}
```

---

## 改动文件

### 1. 新建 `components/layout/nav-actions.tsx`

**原因：** main layout 是纯 Server Component，无法直接挂载 Client Context。
需要新建一个 Client Component 包裹所有需要 UnreadProvider 的导航组件。

```tsx
'use client'

import { UserNav } from './user-nav'
import { MobileMenu } from './mobile-menu'
import { UnreadProvider } from './unread-provider'

export function NavActions() {
  return (
    <UnreadProvider>
      <div className="hidden md:flex">
        <UserNav />
      </div>
      <MobileMenu />
    </UnreadProvider>
  )
}
```

**文件：** `app/(main)/layout.tsx`

把原来的：
```tsx
import { UserNav } from '@/components/layout/user-nav'
import { MobileMenu } from '@/components/layout/mobile-menu'
...
<div className="hidden md:flex">
  <UserNav />
</div>
<MobileMenu />
```

改为：
```tsx
import { NavActions } from '@/components/layout/nav-actions'
...
<NavActions />
```

---

### 2. `components/notifications/notification-bell.tsx`

**改动：** 移除自己的轮询逻辑，改从 useUnread() 读取数据

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { NotificationPanel } from './notification-panel'
import { useUnread } from '@/components/layout/unread-provider'

export function NotificationBell() {
  const { counts, refresh } = useUnread()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-mute hover:text-primary transition-colors rounded-full hover:bg-surface-card"
        aria-label="通知"
      >
        <Bell className="h-5 w-5" />
        {counts.notifications > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {counts.notifications > 9 ? '9+' : counts.notifications}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationPanel
          onClose={() => setIsOpen(false)}
          onUnreadChange={refresh}
        />
      )}
    </div>
  )
}
```

---

### 3. 新建 `components/layout/message-button.tsx`

私信专用图标按钮，显示私信未读角标：

```tsx
'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { useUnread } from '@/components/layout/unread-provider'

export function MessageButton() {
  const { counts } = useUnread()

  return (
    <Link
      href="/messages"
      className="relative p-2 text-mute hover:text-primary transition-colors rounded-full hover:bg-surface-card"
      aria-label="私信"
    >
      <MessageSquare className="h-5 w-5" />
      {counts.messages > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
          {counts.messages > 9 ? '9+' : counts.messages}
        </span>
      )}
    </Link>
  )
}
```

---

### 4. `components/layout/user-nav.tsx`

**改动：**
- 删除所有私信轮询逻辑（fetchUnreadCount、useEffect interval、unreadCount state）
- 删除头像上的未读角标（第80-84行那个 span）
- 删除 import useState 里的 unreadCount（如果只剩 isOpen 则保留 useState）
- 下拉菜单里「私信」条目的角标：改从 useUnread() 读取 counts.messages

```tsx
// 删除
const [unreadCount, setUnreadCount] = useState(0)
useEffect(() => { ... fetchUnreadCount ... }, [])
const fetchUnreadCount = async () => { ... }

// 头像部分删掉
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 ...">...</span>
)}

// 下拉菜单私信条目改为
import { useUnread } from '@/components/layout/unread-provider'
const { counts } = useUnread()

// 私信条目
<Link href="/messages" ...>
  <MessageSquare className="h-4 w-4 mr-2" />
  私信
  {counts.messages > 0 && (
    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
      {counts.messages > 99 ? '99+' : counts.messages}
    </span>
  )}
</Link>
```

⚠️ user-nav.tsx 里不再直接引入 NotificationBell（它已经在导航栏别处渲染），
只需要在导航栏的渲染顺序里确保：NotificationBell → MessageButton → UserNav 头像

---

### 5. `components/layout/user-nav.tsx` 渲染顺序

在 return 里确保顺序：
```tsx
<div className="flex items-center gap-1">
  <NotificationBell />
  <MessageButton />        {/* 新增 */}
  <div className="relative">
    {/* 头像按钮，无角标 */}
    ...
  </div>
</div>
```

---

### 6. `components/notifications/notification-panel.tsx`

**改动：** 修正 INQUIRY_STATUS 的跳转目标

```typescript
// 改前
const TYPE_NAV: Record<string, string> = {
  CARD_VIEWED: '/messages',
  CARD_CONTACTED: '/messages',
  INQUIRY_STATUS: '/messages',
}

// 改后
const TYPE_NAV: Record<string, string> = {
  CARD_VIEWED: '/messages',
  CARD_CONTACTED: '/messages',
  INQUIRY_STATUS: '/profile',  // 意向状态变更 → 个人中心（可查看意向历史）
}
```

同时 `onUnreadChange` 的调用方式改为接收 `refresh` 函数（类型从 `(count: number) => void` 改为 `() => void`）：

```tsx
// NotificationPanel props 类型改为
onUnreadChange: () => void

// markRead 内部改为
onUnreadChange()  // 直接调 refresh，让 Provider 重新拉数据

// markAllRead 内部改为
onUnreadChange()
```

---

### 7. `components/layout/mobile-menu.tsx`

**改动：** 私信链接加未读角标

```tsx
// 在组件顶部加
import { useUnread } from '@/components/layout/unread-provider'
const { counts } = useUnread()

// 私信链接改为
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
```

---

## 执行顺序

1. 新建 `app/api/unread-summary/route.ts`
2. 新建 `components/layout/unread-provider.tsx`
3. 找到 main layout，挂载 UnreadProvider（只在已登录状态下渲染）
4. 改 `notification-bell.tsx` — 移除自有轮询，用 useUnread
5. 新建 `components/layout/message-button.tsx`
6. 改 `user-nav.tsx` — 移除轮询、移除头像角标、加 MessageButton、用 useUnread
7. 改 `notification-panel.tsx` — 修正跳转 + onUnreadChange 类型
8. 改 `mobile-menu.tsx` — 加未读角标

## 验收标准

- [ ] npm run build 通过
- [ ] 头像上无任何角标
- [ ] 导航栏有独立私信图标（MessageSquare），有未读时显示红点
- [ ] 铃铛只显示系统通知未读数
- [ ] 全局只有 1 个轮询（UnreadProvider），不是 2 个
- [ ] 切换 Tab 后轮询暂停，回来立刻刷新
- [ ] 通知面板 INQUIRY_STATUS 点击跳到 /profile
- [ ] 移动端侧边菜单私信有未读角标
- [ ] 下拉菜单「私信」条目仍显示未读数
