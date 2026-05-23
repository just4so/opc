'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, MessageSquare, FileText, Loader2 } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  relatedId: string | null
  createdAt: string
}

const TYPE_ICON: Record<string, typeof Eye> = {
  CARD_VIEWED: Eye,
  CARD_CONTACTED: MessageSquare,
  INQUIRY_STATUS: FileText,
}

const TYPE_NAV: Record<string, string> = {
  CARD_VIEWED: '/messages',
  CARD_CONTACTED: '/messages',
  INQUIRY_STATUS: '/messages',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export function NotificationPanel({
  onClose,
  onUnreadChange,
}: {
  onClose: () => void
  onUnreadChange: (count: number) => void
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const markRead = async (id: string) => {
    await fetch('/api/notifications/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    onUnreadChange(
      notifications.filter((n) => !n.isRead && n.id !== id).length
    )
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    onUnreadChange(0)
  }

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead(n.id)
    const target = TYPE_NAV[n.type] || '/profile'
    onClose()
    router.push(target)
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <span className="font-medium text-sm text-gray-900">通知</span>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">暂无通知</div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || FileText
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                  !n.isRead ? 'border-l-2 border-l-primary bg-orange-50/30' : ''
                }`}
              >
                <Icon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{relativeTime(n.createdAt)}</p>
                </div>
              </button>
            )
          })
        )}
      </div>
      <div className="px-4 py-2 border-t flex items-center justify-between">
        {notifications.some((n) => !n.isRead) ? (
          <button
            onClick={markAllRead}
            className="text-xs text-primary hover:underline"
          >
            全部标记已读
          </button>
        ) : <span />}
        <button
          onClick={() => { onClose(); router.push('/messages') }}
          className="text-xs text-gray-500 hover:text-primary hover:underline"
        >
          查看全部私信 →
        </button>
      </div>
    </div>
  )
}
