import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
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

  const data = issues.map(issue => ({
    ...issue,
    publishedAt: issue.publishedAt.toISOString(),
  }))

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300' },
  })
}
