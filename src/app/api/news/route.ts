import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const revalidate = 300 // 5分钟缓存

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')
    const original = searchParams.get('original')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (original === 'true') {
      where.isOriginal = true
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isOriginal: 'desc' }, { publishedAt: 'desc' }],
      }),
      prisma.news.count({ where }),
    ])

    return NextResponse.json({
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
