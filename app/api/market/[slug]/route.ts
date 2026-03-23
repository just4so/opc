import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// 获取订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // URL 解码处理中文 slug
    const decodedSlug = decodeURIComponent(params.slug)

    const order = await prisma.project.findFirst({
      where: {
        OR: [{ slug: decodedSlug }, { id: decodedSlug }],
        contentType: { in: ['DEMAND', 'COOPERATION'] },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
            verified: true,
            level: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: '订单不存在' },
        { status: 404 }
      )
    }

    // 增加浏览量
    await prisma.project.update({
      where: { id: order.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
