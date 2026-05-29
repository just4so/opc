'use client'

interface TickerEvent {
  text: string
  time: string
}

interface NotificationTickerProps {
  events: TickerEvent[]
}

export function NotificationTicker({ events }: NotificationTickerProps) {
  const content = events.length > 0
    ? events.map(e => e.text).join(' · ')
    : '欢迎来到 OPC 创业者广场 🚀'

  return (
    <div className="h-10 bg-surface-soft text-mute text-sm overflow-hidden flex items-center">
      <div className="container mx-auto px-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  )
}
