import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma, { prismaTransaction } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { slug } = await params
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: '产品不存在' }, { status: 404 })
  }

  const userId = session.user.id
  const existing = await prisma.favorite.findUnique({
    where: { userId_projectId: { userId, projectId: project.id } },
  })

  if (existing) {
    await prismaTransaction.$transaction([
      prisma.favorite.delete({ where: { id: existing.id } }),
      prisma.project.update({
        where: { id: project.id },
        data: { likeCount: { decrement: 1 } },
      }),
    ])
    const updated = await prisma.project.findUnique({ where: { id: project.id }, select: { likeCount: true } })
    return NextResponse.json({ liked: false, favorited: false, likeCount: updated?.likeCount ?? 0 })
  } else {
    await prismaTransaction.$transaction([
      prisma.favorite.create({ data: { userId, projectId: project.id } }),
      prisma.project.update({
        where: { id: project.id },
        data: { likeCount: { increment: 1 } },
      }),
    ])
    const updated = await prisma.project.findUnique({ where: { id: project.id }, select: { likeCount: true } })
    return NextResponse.json({ liked: true, favorited: true, likeCount: updated?.likeCount ?? 0 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false })
  }

  const { slug } = await params
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ favorited: false })
  }

  const favorite = await prisma.favorite.findUnique({
    where: { userId_projectId: { userId: session.user.id, projectId: project.id } },
  })

  return NextResponse.json({ favorited: !!favorite })
}
