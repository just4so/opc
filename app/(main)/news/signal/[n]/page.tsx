import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import prisma from '@/lib/db'
import type { Metadata } from 'next'
import type { Section, Participant } from '@/lib/signal/types'
import { SignalParticipants } from '@/components/signal/SignalParticipants'
import { SignalToc } from '@/components/signal/SignalToc'
import { HotTopicSection } from '@/components/signal/HotTopicSection'
import { PolicySection } from '@/components/signal/PolicySection'
import { CasesSection } from '@/components/signal/CasesSection'
import { ResourcesSection } from '@/components/signal/ResourcesSection'
import { CustomSection } from '@/components/signal/CustomSection'

export const revalidate = 3600

const SECTION_LABELS: Record<string, string> = {
  hot_topic: '热词信号',
  policy: '政策波段',
  cases: '实战信号',
  resources: '资源广播',
  custom: '其他',
}

export async function generateStaticParams() {
  const issues = await prisma.signalIssue.findMany({
    where: { status: 'PUBLISHED' },
    select: { issueNo: true },
  })
  return issues.map(issue => ({ n: String(issue.issueNo) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>
}): Promise<Metadata> {
  const { n } = await params
  const issueNo = parseInt(n)
  if (isNaN(issueNo)) return {}

  const issue = await prisma.signalIssue.findUnique({
    where: { issueNo, status: 'PUBLISHED' },
    select: { title: true, intro: true },
  })
  if (!issue) return {}

  const title = `Weekly Signal 第${issueNo}期 | ${issue.title} — OPC圈`
  const description = issue.intro
    ? issue.intro.slice(0, 120) + '...'
    : `OPC 创业者每周情报汇 · 第${issueNo}期`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.opcquan.com/news/signal/${issueNo}`,
    },
  }
}

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ n: string }>
}) {
  const { n } = await params
  const issueNo = parseInt(n)
  if (isNaN(issueNo)) notFound()

  const issue = await prisma.signalIssue.findUnique({
    where: { issueNo, status: 'PUBLISHED' },
  })
  if (!issue) notFound()

  const participants = issue.participants as Participant[]
  const sections = issue.sections as Section[]
  const publishedDate = issue.publishedAt.toISOString().slice(0, 10)

  const tocItems = sections.map((s, i) => ({
    id: `section-${i}`,
    label:
      s.type === 'hot_topic'
        ? `热词信号 · ${(s as { slot?: string }).slot ?? ''}`
        : (SECTION_LABELS[s.type] ?? s.type),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Hero — full-width dark block breaking out of max-w-3xl padding */}
      <div className="w-full -mx-4 bg-[#0F172A]">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Top nav inside Hero */}
          <div className="flex justify-between items-center mb-8 text-sm">
            <Link href="/news" className="text-white/60 hover:text-white transition-colors">
              ← 返回洞察
            </Link>
            <Link href="/news/signal" className="text-white/60 hover:text-white transition-colors">
              往期档案
            </Link>
          </div>

          {/* Badge + date */}
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white text-sm px-3 py-1 rounded-lg font-medium">
              第 {issue.issueNo} 期
            </span>
            <span className="text-white/60 text-sm mt-2">{publishedDate}</span>
            {issue.activityTime && (
              <span className="text-white/60 text-sm mt-2">{issue.activityTime}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight mt-3">
            {issue.title}
          </h1>

          {/* Participants in dark mode */}
          <div className="mt-6">
            <SignalParticipants participants={participants} variant="dark" />
          </div>
        </div>
      </div>

      {/* Intro */}
      {issue.intro && (
        <div className="mt-8 mb-8 bg-[#0F172A]/5 border-l-4 border-[#0F172A] px-5 py-4 rounded-r-lg text-ink text-sm leading-relaxed">
          {issue.intro}
        </div>
      )}

      {/* 移动端目录（xl 以下显示） */}
      <details className="xl:hidden mb-6 border border-[#E2E8F0] rounded-lg overflow-hidden">
        <summary className="px-4 py-3 bg-[#F8FAFC] text-sm font-medium text-ink cursor-pointer flex items-center justify-between">
          本期目录
          <ChevronDown className="h-4 w-4 text-mute" />
        </summary>
        <div className="px-4 py-3 space-y-1">
          {tocItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="block text-sm text-mute hover:text-primary py-1">
              {item.label}
            </a>
          ))}
        </div>
      </details>

      {/* Sections with TOC */}
      <div className="xl:flex xl:gap-8 xl:items-start mt-8">
        <div className="flex-1 min-w-0 space-y-10">
          {sections.map((section, i) => (
            <section key={i} id={`section-${i}`}>
              {/* Section divider */}
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-hairline-soft">
                <div className="w-1 h-5 rounded-full bg-primary flex-shrink-0" />
                <span className="font-semibold text-ink">
                  {section.type === 'hot_topic'
                    ? `热词信号 · ${(section as { slot?: string }).slot ?? ''}`
                    : SECTION_LABELS[section.type] ?? section.type}
                </span>
              </div>

              {section.type === 'hot_topic' && (
                <HotTopicSection section={section} />
              )}
              {section.type === 'policy' && (
                <PolicySection section={section} />
              )}
              {section.type === 'cases' && (
                <CasesSection section={section} />
              )}
              {section.type === 'resources' && (
                <ResourcesSection section={section} />
              )}
              {section.type === 'custom' && (
                <CustomSection section={section} />
              )}
            </section>
          ))}
        </div>

        <SignalToc sections={tocItems} />
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-hairline-soft space-y-4">
        <p className="text-mute text-sm">每周四 12:00–13:00，线上腾讯会议</p>
        <a
          href="https://jcndsl3lwezo.feishu.cn/share/base/form/shrcnWCpF295szJpvnTpVcgmyTc"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 rounded-2xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          我要投稿
        </a>
      </div>
    </div>
  )
}
