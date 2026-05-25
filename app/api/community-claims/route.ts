import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { communityId, communityName, contactName, contactInfo, description, type, city } = body

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.communityClaim.count({
      where: { contactInfo, createdAt: { gte: oneHourAgo } },
    })
    if (recentCount >= 3) {
      return NextResponse.json({ error: '提交过于频繁，请稍后再试' }, { status: 429 })
    }

    if (type === 'CLAIM') {
      if (!communityId || !contactName || !contactInfo) {
        return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
      }
      const community = await prisma.community.findUnique({ where: { id: communityId } })
      if (!community) {
        return NextResponse.json({ error: '社区不存在' }, { status: 404 })
      }
    } else if (type === 'SUBMISSION') {
      if (!communityName || !contactInfo || !city) {
        return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: '无效类型' }, { status: 400 })
    }

    const claim = await prisma.communityClaim.create({
      data: {
        communityId: communityId || null,
        communityName: communityName || '',
        contactName: contactName || communityName || '',
        contactInfo,
        description: description || null,
        type: type || 'CLAIM',
        city: city || null,
      },
    })

    return NextResponse.json({ success: true, id: claim.id })
  } catch (error) {
    console.error('提交社区认领/收录失败:', error)
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}
