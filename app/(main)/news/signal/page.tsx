import Link from 'next/link'
import prisma from '@/lib/db'
import type { Participant } from '@/lib/signal/types'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Weekly Signal 往期档案 — OPC圈',
  description: 'OPC 创业者每周情报交换活动的完整档案。每期包含 AI 热词解读、政策波段、实战分享与资源广播。',
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
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-2xl font-bold text-ink">Weekly Signal · 往期档案</h1>
          <span className="text-mute text-sm">{serialized.length} 期</span>
        </div>
        <p className="text-mute text-sm mt-1">OPC 创业者每周情报汇</p>
      </div>

      {serialized.length === 0 ? (
        <div className="text-center py-20 text-mute">每周四更新，敬请期待</div>
      ) : (
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
          {serialized.map((issue, idx) => {
            const cities = Array.from(new Set(issue.participants.map(p => p.city)))
            const date = issue.publishedAt.slice(0, 10)
            const isLatest = issue.issueNo === latestNo

            return (
              <div
                key={issue.issueNo}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 items-center py-3 px-4 border-b border-[#E2E8F0] last:border-b-0 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'
                }`}
              >
                {/* Issue badge */}
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 whitespace-nowrap">
                  第 {issue.issueNo} 期
                  {isLatest && (
                    <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </span>

                {/* Title */}
                <span className="font-medium text-ink text-sm flex-1 min-w-0 truncate">
                  {issue.title}
                </span>

                {/* Date */}
                <span className="text-mute text-sm flex-shrink-0 whitespace-nowrap">{date}</span>

                {/* Cities — hidden on mobile */}
                <div className="hidden md:flex gap-1 flex-shrink-0">
                  {cities.map(city => (
                    <span
                      key={city}
                      className="text-xs px-2 py-0.5 rounded-full bg-surface-card text-ash border border-hairline-soft"
                    >
                      {city}
                    </span>
                  ))}
                </div>

                {/* Link */}
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
