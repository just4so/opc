import prisma from '@/lib/db'
import Link from 'next/link'
import { RadarSidebar } from '@/components/radar/RadarSidebar'

export default async function RadarLayout({ children }: { children: React.ReactNode }) {
  const recentIssues = await prisma.radarIssue.findMany({
    orderBy: { issueNo: 'desc' },
    take: 60,
    select: { issueNo: true, publishedAt: true, title: true },
  })

  const serialized = recentIssues.map(i => ({
    issueNo: i.issueNo,
    publishedAt: i.publishedAt.toISOString(),
    title: i.title,
  }))

  const latestIssueNo = recentIssues[0]?.issueNo ?? 1

  return (
    <div className="bg-[#FFFBF5] min-h-screen flex">
      {/* 桌面端左侧深色侧边栏 */}
      <aside className="hidden md:flex w-52 shrink-0 flex-col bg-[#1C1917] h-screen sticky top-0 overflow-hidden border-r border-[#F97316]">
        {/* 顶部品牌区 */}
        <div className="px-4 pt-6 pb-5 border-b border-[#292524]">
          <Link href="/radar" className="block">
            <div className="text-[#F97316] font-black text-xl tracking-[0.2em] mb-1">RADAR</div>
            <div className="text-[#78716C] text-xs tracking-widest">OPC 雷达 · 情报归档</div>
          </Link>
        </div>

        {/* 归档列表（Client Component 处理折叠交互） */}
        <RadarSidebar issues={serialized} latestIssueNo={latestIssueNo} />

        {/* 底部 RSS */}
        <div className="px-4 py-3 border-t border-[#292524]">
          <Link
            href="/radar/feed.xml"
            className="flex items-center gap-2 text-[#57534E] hover:text-[#F97316] transition-colors"
            title="RSS 订阅"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="6.18" cy="17.82" r="2.18"/>
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
            </svg>
            <span className="text-[11px] tracking-wide">RSS 订阅</span>
          </Link>
        </div>
      </aside>

      {/* 移动端顶部导航 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden bg-[#1C1917] px-4 py-2 flex items-center gap-3 overflow-x-auto shrink-0">
          <span className="text-[#F97316] font-black text-xs tracking-widest shrink-0">RADAR</span>
          <span className="text-[#44403C] shrink-0">·</span>
          {recentIssues.slice(0, 10).map(issue => (
            <Link
              key={issue.issueNo}
              href={`/radar/${issue.issueNo}`}
              className="shrink-0 text-xs px-2.5 py-1 rounded text-[#A8A29E] hover:text-[#F97316] hover:bg-[#292524] transition-colors font-mono"
            >
              #{issue.issueNo}
            </Link>
          ))}
        </div>
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
