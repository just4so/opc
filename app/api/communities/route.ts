import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const city = searchParams.get('city') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(24, Math.max(1, parseInt(searchParams.get('pageSize') || '12')))

    const where = {
      status: 'ACTIVE' as const,
      ...(city ? { city } : {}),
    }

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { featured: 'desc' },
          { updatedAt: 'desc' },
        ],
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          district: true,
          operator: true,
          totalWorkstations: true,
          featured: true,
          coverImage: true,
          entryFriendly: true,
          benefits: true,
          focusTracks: true,
          description: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.community.count({ where }),
    ])

    // Normalize nullable fields for client type safety
    const mapped = communities.map((c) => ({
      ...c,
      address: c.address ?? '',
      description: c.description
        ? c.description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
        : '',
    }))

    return NextResponse.json({
      communities: mapped,
      total,
      hasMore: page * pageSize < total,
    })
  } catch (error) {
    console.error('Error fetching communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    )
  }
}
