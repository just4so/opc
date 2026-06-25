import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

export async function GET() {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const issues = await prisma.signalIssue.findMany({
    orderBy: { issueNo: 'desc' },
    select: { id: true, issueNo: true, title: true, publishedAt: true, status: true },
  })

  const data = issues.map((issue) => ({
    ...issue,
    publishedAt: issue.publishedAt.toISOString(),
  }))

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const body = await req.json()

  const issue = await prisma.signalIssue.create({
    data: {
      issueNo: body.issueNo,
      title: body.title,
      publishedAt: new Date(body.publishedAt),
      activityTime: body.activityTime ?? null,
      intro: body.intro ?? null,
      participants: body.participants,
      sections: body.sections,
      status: 'DRAFT',
    },
  })

  return NextResponse.json({ id: issue.id })
}
