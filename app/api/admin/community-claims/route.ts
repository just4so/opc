import { NextRequest, NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (communityId) where.communityId = communityId
    if (status) where.status = status
    if (type) where.type = type

    const claims = await prisma.communityClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        community: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json({
      claims: claims.map((c) => ({
        ...c,
        createdAt: typeof c.createdAt === 'string' ? c.createdAt : c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('获取社区认领列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireStaffApi()
    if (staff instanceof NextResponse) return staff

    const { id, status } = await request.json()
    if (!id || !['PENDING', 'CONTACTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const updated = await prisma.communityClaim.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('更新认领状态失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
