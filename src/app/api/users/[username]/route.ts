import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        level: true,
        verified: true,
        verifyType: true,
        skills: true,
        canOffer: true,
        lookingFor: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
