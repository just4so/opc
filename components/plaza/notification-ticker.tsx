'use client'

import Link from 'next/link'

interface TickerEvent {
  text: string
  time: string
  link: string
}

interface NotificationTickerProps {
  events: TickerEvent[]
}

export function NotificationTicker({ events }: NotificationTickerProps) {
  if (events.length === 0) {
    return (
      <div className="h-10 bg-surface-soft text-mute text-sm overflow-hidden flex items-center">
        <div className="container mx-auto px-4">
          <span>欢迎来到 OPC 创业者广场 🚀</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-10 bg-surface-soft text-sm overflow-hidden flex items-center group">
      <div className="container mx-auto px-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
          {events.map((event, i) => (
            <span key={i}>
              {i > 0 && <span className="text-ash mx-3">·</span>}
              <Link
                href={event.link}
                className="text-mute hover:text-primary transition-colors"
              >
                {event.text}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
