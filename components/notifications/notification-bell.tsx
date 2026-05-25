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
