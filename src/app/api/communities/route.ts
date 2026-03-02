import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const city = searchParams.get('city')
    const status = searchParams.get('status') || 'ACTIVE'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (city) {
      where.city = city
    }

    if (status) {
      where.status = status
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          district: true,
          address: true,
          latitude: true,
          longitude: true,
          description: true,
          type: true,
          focus: true,
          operator: true,
          spaceSize: true,
          workstations: true,
          policies: true,
          status: true,
          featured: true,
          coverImage: true,
          createdAt: true,
        },
      }),
      prisma.community.count({ where }),
    ])

    return NextResponse.json({
      data: communities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}
