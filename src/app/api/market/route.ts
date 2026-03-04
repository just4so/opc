import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 获取接单市场列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') // DEMAND or COOPERATION
    const category = searchParams.get('category')
    const budgetType = searchParams.get('budgetType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const where: any = {
      status: 'PUBLISHED',
      contentType: {
        in: ['DEMAND', 'COOPERATION'],
      },
    }

    if (type && (type === 'DEMAND' || type === 'COOPERATION')) {
      where.contentType = type
    }

    if (category) {
      where.category = { has: category }
    }

    if (budgetType) {
      where.budgetType = budgetType
    }

    const [orders, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              verified: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching market orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// 发布订单
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      contentType,
      name,
      tagline,
      description,
      category,
      skills,
      budgetType,
      budgetMin,
      budgetMax,
      deadline,
      contactType,
      contactInfo,
    } = body

    // 验证必填字段
    if (!contentType || !name || !tagline || !description) {
      return NextResponse.json(
        { error: '请填写必填字段' },
        { status: 400 }
      )
    }

    // 验证内容类型
    if (contentType !== 'DEMAND' && contentType !== 'COOPERATION') {
      return NextResponse.json(
        { error: '无效的订单类型' },
        { status: 400 }
      )
    }

    // 生成 slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    const order = await prisma.project.create({
      data: {
        slug,
        contentType,
        name,
        tagline,
        description,
        category: category || [],
        skills: skills || [],
        budgetType: budgetType || 'NEGOTIABLE',
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        deadline: deadline ? new Date(deadline) : null,
        contactType,
        contactInfo,
        ownerId: session.user.id,
        techStack: [], // 保留字段，设为空
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
