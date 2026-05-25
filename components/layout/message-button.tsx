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
