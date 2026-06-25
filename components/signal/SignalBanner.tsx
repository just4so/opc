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
    <div className="bg-[#0F172A] rounded-xl px-6 py-8 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded bg-primary text-white font-medium">
            第 {issue.issueNo} 期
          </span>
          <span className="text-white/60 text-xs">{date}</span>
        </div>
        <div className="text-white font-bold text-xl leading-snug mb-2">{issue.title}</div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map(city => (
            <span
              key={city}
              className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link
          href={`/news/signal/${issue.issueNo}`}
          className="inline-block w-full md:w-auto px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          查看本期 →
        </Link>
      </div>
    </div>
  )
}
