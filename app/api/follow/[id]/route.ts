import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: targetId } = await context.params

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetId,
      },
    },
  })

  return NextResponse.json({ isFollowing: !!follow })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: targetId } = await context.params

  if (session.user.id === targetId) {
    return NextResponse.json({ error: '不能关注自己' }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetId,
      },
    },
    create: {
      followerId: session.user.id,
      followingId: targetId,
    },
    update: {},
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { id: targetId } = await context.params

  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: targetId,
    },
  })

  return NextResponse.json({ success: true })
}
