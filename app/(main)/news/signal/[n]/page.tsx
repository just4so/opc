import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import type { Metadata } from 'next'
import type { Section, Participant } from '@/lib/signal/types'
import { SignalParticipants } from '@/components/signal/SignalParticipants'
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
    select: { title: true },
  })
  if (!issue) return {}

  return {
    title: `Weekly Signal 第${issueNo}期 | ${issue.title} — OPC圈`,
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Top nav */}
      <div className="flex justify-between items-center mb-8 text-sm">
        <Link href="/news" className="text-mute hover:text-primary">
          ← 返回洞察
        </Link>
        <Link href="/news/signal" className="text-mute hover:text-primary">
          往期档案
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            第 {issue.issueNo} 期
          </span>
          <span className="text-mute text-sm">{publishedDate}</span>
          {issue.activityTime && (
            <span className="text-ash text-sm">{issue.activityTime}</span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">{issue.title}</h1>
      </div>

      {/* Participants */}
      <div className="mb-6">
        <SignalParticipants participants={participants} />
      </div>

      {/* Intro */}
      {issue.intro && (
        <div className="mb-8 bg-primary/5 border-l-4 border-primary px-4 py-3 text-ink text-sm leading-relaxed">
          {issue.intro}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section, i) => (
          <section key={i}>
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
