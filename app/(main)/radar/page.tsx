import prisma from '@/lib/db'
import { IssueView } from '@/components/radar/IssueView'
import { serializeIssue } from '@/lib/radar/serializeIssue'
import Link from 'next/link'

export const revalidate = 300

export default async function RadarPage() {
  const latestIssue = await prisma.radarIssue.findFirst({
    orderBy: { issueNo: 'desc' },
    include: { items: { orderBy: [{ importance: 'desc' }, { collectedAt: 'desc' }] } },
  })

  if (!latestIssue) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[#78716C] mb-4">还没有发布任何期号</p>
        <Link href="/admin/radar" className="text-sm text-[#F97316] underline">前往录入</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <IssueView issue={serializeIssue(latestIssue)} />
    </div>
  )
}
