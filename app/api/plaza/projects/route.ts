import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const direction = searchParams.get('direction') || ''
  const city = searchParams.get('city') || ''
  const stage = searchParams.get('stage') || ''
  const search = searchParams.get('search') || ''

  const where: any = {
    status: 'PUBLISHED',
    owner: {
      showInPlaza: true,
    },
  }

  if (direction) {
    where.owner.mainTrack = direction
  }
  if (city) {
    where.owner.location = city
  }
  if (stage) {
    where.stage = stage
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
}
