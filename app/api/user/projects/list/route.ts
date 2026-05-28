import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true },
  })

  return NextResponse.json(projects)
}
