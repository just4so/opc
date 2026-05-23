import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

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
