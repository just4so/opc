import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const contentType = searchParams.get('contentType')

    const where: any = {}
    if (status) where.status = status
    if (contentType) where.contentType = contentType
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * LIMIT,
        take: LIMIT,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { username: true, name: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit: LIMIT,
        total,
        totalPages: Math.ceil(total / LIMIT),
      },
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
