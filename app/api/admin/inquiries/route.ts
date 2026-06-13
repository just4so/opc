import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi, cityFilter, isInScope } from '@/lib/admin'
import prisma from '@/lib/db'
import { createInquiryStatusNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffContextApi()
    if (staff instanceof NextResponse) return staff

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const communityId = searchParams.get('communityId')
    const q = searchParams.get('q')?.trim()

    const baseFilter = cityFilter(staff)
    const where: Record<string, unknown> = { ...baseFilter }

    if (status) {
      where.status = status
    }
    if (city) {
      if (baseFilter.city) {
        const allowed = baseFilter.city.in
        where.city = allowed.includes(city) ? city : '__NONE__'
      } else {
        where.city = city
      }
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
    const staff = await requireStaffContextApi()
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

    if (staff.role === 'CITY_MANAGER') {
      const existing = await prisma.inquiry.findUnique({
        where: { id },
        select: { city: true },
      })
      if (!existing) return NextResponse.json({ error: '意向不存在' }, { status: 404 })
      if (!isInScope(staff, existing.city)) {
        return NextResponse.json({ error: '无权操作该城市的数据' }, { status: 403 })
      }
    }

    const existingInquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true, contact: true, city: true, status: true },
    })

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status: status as 'PENDING' | 'CONTACTED' | 'DONE' | 'CANCELLED' },
    })

    void createInquiryStatusNotification(inquiry.userId, inquiry.id, status)

    if (existingInquiry && existingInquiry.status !== status) {
      prisma.auditLog.create({
        data: {
          userId: staff.id,
          userName: staff.name || staff.username,
          userRole: staff.role,
          action: 'STATUS_CHANGE',
          targetType: 'INQUIRY',
          targetId: inquiry.id,
          targetName: existingInquiry.contact || 'Unknown',
          changes: JSON.parse(JSON.stringify({ status: { from: existingInquiry.status, to: status } })),
        },
      }).catch(console.error)
    }

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
