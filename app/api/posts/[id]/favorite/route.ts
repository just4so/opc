import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: postId } = await params
  const userId = session.user.id

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_postId: { userId, postId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  } else {
    await prisma.favorite.create({ data: { userId, postId } })
    return NextResponse.json({ favorited: true })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false })
  }

  const { id: postId } = await params
  const userId = session.user.id

  const favorite = await prisma.favorite.findUnique({
    where: { userId_postId: { userId, postId } },
  })

  return NextResponse.json({ favorited: !!favorite })
}
