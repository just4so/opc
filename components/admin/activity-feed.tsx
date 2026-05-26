'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, PhoneForwarded, FileText, MapPinned } from 'lucide-react'

interface ActivityItem {
  type: 'user' | 'inquiry' | 'post' | 'claim'
  title: string
  subtitle: string
  time: string
  link: string
}

const TYPE_CONFIG: Record<string, { icon: typeof User; color: string; bg: string }> = {
  user: { icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
  inquiry: { icon: PhoneForwarded, color: 'text-orange-600', bg: 'bg-orange-100' },
  post: { icon: FileText, color: 'text-green-600', bg: 'bg-green-100' },
  claim: { icon: MapPinned, color: 'text-purple-600', bg: 'bg-purple-100' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/activity')
      .then(res => res.json())
      .then(data => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">加载中...</div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">暂无最近活动</div>
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.user
        const Icon = config.icon
        return (
          <Link
            key={`${item.type}-${item.time}-${i}`}
            href={item.link}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className={`p-1.5 rounded-lg ${config.bg} flex-shrink-0`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate group-hover:text-primary transition-colors">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
              {relativeTime(item.time)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
