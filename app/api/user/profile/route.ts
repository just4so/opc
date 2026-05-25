import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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
        emailVerified: true,
        canOffer: true,
        lookingFor: true,
        mainTrack: true,
        startupStage: true,
        showInPlaza: true,
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

    const profileSchema = z.object({
      avatar: z.string().max(500).optional(),
      bio: z.string().max(200).optional(),
      location: z.string().max(50).optional(),
      website: z.string().max(200).optional(),
      wechat: z.string().max(50).optional(),
      canOffer: z.array(z.string().max(50)).max(10).optional(),
      lookingFor: z.array(z.string().max(50)).max(10).optional(),
      mainTrack: z.string().max(50).optional(),
      startupStage: z.string().max(50).optional(),
      showInPlaza: z.boolean().optional(),
    }).strict()

    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || '参数错误' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        wechat: true,
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
