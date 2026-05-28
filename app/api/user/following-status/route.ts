import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ statuses: {} })
  }

  const idsParam = request.nextUrl.searchParams.get('ids') || ''
  const ids = idsParam.split(',').filter(Boolean).slice(0, 50)

  if (ids.length === 0) {
    return NextResponse.json({ statuses: {} })
  }

  const follows = await prisma.follow.findMany({
    where: {
      followerId: session.user.id,
      followingId: { in: ids },
    },
    select: { followingId: true },
  })

  const statuses: Record<string, boolean> = {}
  for (const id of ids) {
    statuses[id] = false
  }
  for (const f of follows) {
    statuses[f.followingId] = true
  }

  return NextResponse.json({ statuses })
}
