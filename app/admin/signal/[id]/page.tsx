import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import { SignalParticipants } from '@/components/signal/SignalParticipants'
import { HotTopicSection } from '@/components/signal/HotTopicSection'
import { PolicySection } from '@/components/signal/PolicySection'
import { CasesSection } from '@/components/signal/CasesSection'
import { ResourcesSection } from '@/components/signal/ResourcesSection'
import { CustomSection } from '@/components/signal/CustomSection'
import type { Section, Participant } from '@/lib/signal/types'
import SignalAdminActions from './SignalAdminActions'

export const dynamic = 'force-dynamic'

export default async function AdminSignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaff()
  const { id } = await params

  const issue = await prisma.signalIssue.findUnique({ where: { id } })
  if (!issue) notFound()

  const participants = issue.participants as unknown as Participant[]
  const sections = issue.sections as unknown as Section[]

  return (
    <div className="p-6 max-w-4xl">
      {/* Actions bar */}
      <SignalAdminActions
        id={issue.id}
        issueNo={issue.issueNo}
        status={issue.status}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            第 {issue.issueNo} 期
          </span>
          <span className="text-mute text-xs">{issue.publishedAt.toISOString().slice(0, 10)}</span>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-4">{issue.title}</h1>
        {issue.intro && (
          <p className="text-mute text-sm leading-relaxed mb-4">{issue.intro}</p>
        )}
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-ink mb-3">本期参与者</h2>
          <SignalParticipants participants={participants} />
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => {
          if (section.type === 'hot_topic') return <HotTopicSection key={index} section={section} />
          if (section.type === 'policy') return <PolicySection key={index} section={section} />
          if (section.type === 'cases') return <CasesSection key={index} section={section} />
          if (section.type === 'resources') return <ResourcesSection key={index} section={section} />
          if (section.type === 'custom') return <CustomSection key={index} section={section} />
          return null
        })}
      </div>
    </div>
  )
}
