import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ n: string }> }
) {
  const { n } = await params
  const issueNo = parseInt(n)

  if (isNaN(issueNo)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const issue = await prisma.signalIssue.findUnique({
    where: { issueNo, status: 'PUBLISHED' },
  })

  if (!issue) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...issue,
    publishedAt: issue.publishedAt.toISOString(),
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  })
}
