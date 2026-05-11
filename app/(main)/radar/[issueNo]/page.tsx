import prisma from '@/lib/db'
import { IssueView } from '@/components/radar/IssueView'
import { serializeIssue } from '@/lib/radar/serializeIssue'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 300


export async function generateMetadata({ params }: { params: Promise<{ issueNo: string }> }) {
  const { issueNo } = await params
  const no = parseInt(issueNo)
  if (isNaN(no)) return {}

  const issue = await prisma.radarIssue.findUnique({ where: { issueNo: no } })
  if (!issue) return {}

  const title = `OPC 雷达 ${issue.title || '第' + issue.issueNo + '期'}`
  const description = issue.summary || '本期收录了针对独立开发者的最新政策、工具及社区动向，点击查看详情。'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  }
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ issueNo: string }>
}) {
  const { issueNo } = await params
  const no = parseInt(issueNo)
  if (isNaN(no)) notFound()

  const issue = await prisma.radarIssue.findUnique({
    where: { issueNo: no },
    include: { items: { orderBy: [{ importance: 'desc' }, { collectedAt: 'desc' }] } },
  })

  if (!issue) notFound()

  const adjacent = await prisma.radarIssue.findMany({
    where: { issueNo: { in: [no - 1, no + 1] } },
    select: { issueNo: true },
  })

  const prev = adjacent.find(i => i.issueNo === no - 1)
  const next = adjacent.find(i => i.issueNo === no + 1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <IssueView issue={serializeIssue(issue)} />

      <div className="mt-12 pt-6 border-t border-[#E7E5E4] flex justify-between text-sm">
        {prev ? (
          <Link href={`/radar/${prev.issueNo}`} className="text-[#78716C] hover:text-[#F97316] hover:underline">
            ← 第 {prev.issueNo} 期
          </Link>
        ) : <span />}
        <Link href="/radar" className="text-[#78716C] hover:text-[#F97316]">最新一期</Link>
        {next ? (
          <Link href={`/radar/${next.issueNo}`} className="text-[#78716C] hover:text-[#F97316] hover:underline">
            第 {next.issueNo} 期 →
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}
