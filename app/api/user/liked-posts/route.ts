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

  const likes = await prisma.like.findMany({
    where: {
      userId: session.user.id,
      postId: { in: ids },
    },
    select: { postId: true },
  })

  const map: Record<string, boolean> = {}
  for (const like of likes) {
    if (like.postId) map[like.postId] = true
  }

  return NextResponse.json(map)
}
