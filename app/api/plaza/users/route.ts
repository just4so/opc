import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))
    const location = searchParams.get('location') || ''
    const mainTrack = searchParams.get('mainTrack') || ''
    const stage = searchParams.get('stage') || ''
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'latest'

    const baseWhere = {
      OR: [
        { bio: { not: null } },
        { bio: { not: '' } },
        { projects: { some: { status: 'PUBLISHED' } } },
      ],
    }

    const where: Record<string, unknown> = {}
    if (location) where.location = location
    if (mainTrack) where.mainTrack = mainTrack
    if (stage) where.startupStage = stage

    if (search) {
      where.AND = [
        { OR: baseWhere.OR },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    } else {
      where.OR = baseWhere.OR
    }

    let orderBy: Record<string, unknown>[]
    if (sort === 'followers') {
      orderBy = [{ followers: { _count: 'desc' } }, { createdAt: 'desc' }]
    } else {
      orderBy = [{ verified: 'desc' }, { createdAt: 'desc' }]
    }

    const [total, rawUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          location: true,
          mainTrack: true,
          startupStage: true,
          verified: true,
          verifyType: true,
          projects: {
            where: { status: 'PUBLISHED' as const },
            take: 2,
            orderBy: { createdAt: 'desc' as const },
            select: { id: true, name: true, slug: true, description: true, stage: true, website: true },
          },
          _count: {
            select: { followers: true, projects: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const users = rawUsers.map(u => ({
      ...u,
      followerCount: u._count.followers,
      projectCount: u._count.projects,
    }))

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取广场创业者列表失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
