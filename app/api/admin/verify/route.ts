import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireStaff } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await requireStaff()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const filter = searchParams.get('filter')

  const where: any = { showInPlaza: true }
  if (filter === 'VERIFIED') where.verified = true
  if (filter === 'UNVERIFIED') where.verified = false

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        mainTrack: true,
        location: true,
        verified: true,
        verifyType: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  const serialized = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return NextResponse.json({ users: serialized, total })
}
