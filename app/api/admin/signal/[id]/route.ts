import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const { id } = await params
  const issue = await prisma.signalIssue.findUnique({ where: { id } })

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const { id } = await params
  const { status } = await req.json()

  await prisma.signalIssue.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const { id } = await params
  await prisma.signalIssue.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
