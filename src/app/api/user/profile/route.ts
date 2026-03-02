import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// 获取当前用户信息
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        wechat: true,
        role: true,
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
            projects: true,
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
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()

    // 只允许更新特定字段
    const allowedFields = [
      'name',
      'bio',
      'location',
      'website',
      'wechat',
      'skills',
      'canOffer',
      'lookingFor',
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        website: true,
        wechat: true,
        skills: true,
        canOffer: true,
        lookingFor: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
