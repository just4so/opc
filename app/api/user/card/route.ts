import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const LOOKING_FOR_OPTIONS = [
  '找社区入驻', '找合作伙伴', '找客户', '找投资', '找技术支持', '找曝光机会', '其他',
]

const CAN_OFFER_OPTIONS = [
  '技术开发', '设计', '内容创作', '市场营销', '财务法务', '行业资源', '其他',
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        bio: true,
        mainTrack: true,
        startupStage: true,
        location: true,
        lookingFor: true,
        canOffer: true,
        wechat: true,
        showInPlaza: true,
        projects: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            stage: true,
            website: true,
            contentType: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('获取卡片信息失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body.bio !== undefined) updateData.bio = body.bio || null
    if (body.mainTrack !== undefined) updateData.mainTrack = body.mainTrack || null
    if (body.startupStage !== undefined) updateData.startupStage = body.startupStage || null
    if (body.location !== undefined) updateData.location = body.location || null
    if (body.wechat !== undefined) updateData.wechat = body.wechat || null
    if (typeof body.showInPlaza === 'boolean') updateData.showInPlaza = body.showInPlaza

    if (Array.isArray(body.lookingFor)) {
      updateData.lookingFor = body.lookingFor.filter((v: string) =>
        LOOKING_FOR_OPTIONS.includes(v)
      )
    }

    if (Array.isArray(body.canOffer)) {
      updateData.canOffer = body.canOffer.filter((v: string) =>
        CAN_OFFER_OPTIONS.includes(v)
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        bio: true,
        mainTrack: true,
        startupStage: true,
        location: true,
        lookingFor: true,
        canOffer: true,
        wechat: true,
        showInPlaza: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('更新卡片信息失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
