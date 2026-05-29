import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({})
  }

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').filter(Boolean).slice(0, 50)

  if (ids.length === 0) {
    return NextResponse.json({})
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      projectId: { in: ids },
    },
    select: { projectId: true },
  })

  const map: Record<string, boolean> = {}
  for (const fav of favorites) {
    if (fav.projectId) map[fav.projectId] = true
  }

  return NextResponse.json(map)
}
