import Link from 'next/link'
import type { Participant } from '@/lib/signal/types'

type Props = {
  issue: {
    issueNo: number
    title: string
    publishedAt: string
    participants: Participant[]
  }
}

export function SignalBanner({ issue }: Props) {
  const cities = Array.from(new Set(issue.participants.map(p => p.city)))
  const date = issue.publishedAt.slice(0, 10)

  return (
    <div className="bg-surface-card rounded-2xl border border-hairline-soft p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            第 {issue.issueNo} 期
          </span>
          <span className="text-mute text-xs">{date}</span>
        </div>
        <div className="font-semibold text-ink text-base leading-snug mb-2">{issue.title}</div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map(city => (
            <span
              key={city}
              className="text-xs px-2 py-0.5 rounded-full bg-canvas text-ash border border-hairline-soft"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link
          href={`/news/signal/${issue.issueNo}`}
          className="inline-block px-4 py-2 rounded-2xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          查看本期 →
        </Link>
      </div>
    </div>
  )
}
