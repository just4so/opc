import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'
import { createInquiryStatusNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const communityId = searchParams.get('communityId')
    const q = searchParams.get('q')?.trim()

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }
    if (city) {
      where.city = city
    }
    if (communityId) {
      where.communityId = communityId
    }
    if (q) {
      where.OR = [
        { contact: { contains: q } },
        { name: { contains: q } },
        { communityName: { contains: q } },
        { community: { name: { contains: q } } },
      ]
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip: (page - 1) * LIMIT,
        take: LIMIT,
        orderBy: { createdAt: 'desc' },
        include: {
          community: {
            select: { id: true, name: true, slug: true },
          },
          user: {
            select: { username: true },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ])

    return NextResponse.json({
      inquiries: inquiries.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit: LIMIT,
        total,
        totalPages: Math.ceil(total / LIMIT),
      },
    })
  } catch (error) {
    console.error('获取意向列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const body = await request.json()
    const { id, status } = body as { id: string; status: string }

    if (!id || !status) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'CONTACTED', 'DONE', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效状态' }, { status: 400 })
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status: status as 'PENDING' | 'CONTACTED' | 'DONE' | 'CANCELLED' },
    })

    void createInquiryStatusNotification(inquiry.userId, inquiry.id, status)

    return NextResponse.json({
      ...inquiry,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('更新意向状态失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
