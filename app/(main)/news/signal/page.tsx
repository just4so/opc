import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import type { Participant } from '@/lib/signal/types'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Weekly Signal 往期档案 — OPC圈',
}

export default async function SignalArchivePage() {
  const issues = await prisma.signalIssue.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { issueNo: 'desc' },
    select: {
      issueNo: true,
      title: true,
      publishedAt: true,
      participants: true,
    },
  })

  const serialized = issues.map(issue => ({
    ...issue,
    publishedAt: issue.publishedAt.toISOString(),
    participants: issue.participants as Participant[],
  }))

  const latestNo = serialized[0]?.issueNo ?? null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back link + header */}
      <div className="mb-6">
        <Link href="/news" className="text-mute text-sm hover:text-primary">
          ← 返回洞察
        </Link>
        <h1 className="text-2xl font-bold text-ink mt-3">Weekly Signal · 往期档案</h1>
        <p className="text-mute text-sm mt-1">OPC 创业者每周情报汇</p>
      </div>

      {serialized.length === 0 ? (
        <div className="text-center py-20 text-mute">每周四更新，敬请期待</div>
      ) : (
        <div className="space-y-2">
          {serialized.map(issue => {
            const cities = Array.from(new Set(issue.participants.map(p => p.city)))
            const date = issue.publishedAt.slice(0, 10)
            const isLatest = issue.issueNo === latestNo

            return (
              <div
                key={issue.issueNo}
                className="flex items-center gap-3 py-3 border-b border-hairline-soft flex-wrap"
              >
                <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
                  第 {issue.issueNo} 期
                </span>
                {isLatest && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white flex-shrink-0">
                    NEW
                  </span>
                )}
                <span className="font-semibold text-ink flex-1 min-w-0">{issue.title}</span>
                <span className="text-mute text-sm flex-shrink-0">{date}</span>
                <div className="flex gap-1 flex-wrap">
                  {cities.map(city => (
                    <span
                      key={city}
                      className="text-xs px-2 py-0.5 rounded-full bg-surface-card text-ash border border-hairline-soft"
                    >
                      {city}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/news/signal/${issue.issueNo}`}
                  className="text-primary text-sm hover:underline flex-shrink-0"
                >
                  查看
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
