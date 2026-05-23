import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { communityId, communityName, contactName, contactInfo, description, type, city } = body

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
