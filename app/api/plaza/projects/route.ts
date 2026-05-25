import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const direction = searchParams.get('direction') || ''
    const city = searchParams.get('city') || ''
    const stage = searchParams.get('stage') || ''
    const search = searchParams.get('search') || ''
    const contentType = searchParams.get('contentType') || ''

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      tagline: { not: '' },
      owner: {
        showInPlaza: true,
      } as Record<string, unknown>,
    }

    const ownerWhere = where.owner as Record<string, unknown>
    if (direction) {
      ownerWhere.mainTrack = direction
    }
    if (city) {
      ownerWhere.location = city
    }
    if (stage) {
      where.stage = stage
    }
    if (contentType) {
      where.contentType = contentType
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [
          { owner: { verified: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          tagline: true,
          description: true,
          stage: true,
          website: true,
          contentType: true,
          owner: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
              location: true,
              verified: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取广场产品列表失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
