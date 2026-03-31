import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { topics: true },
    })

    const countMap: Record<string, number> = {}
    for (const post of posts) {
      for (const tag of post.topics) {
        countMap[tag] = (countMap[tag] || 0) + 1
      }
    }

    let tags = Object.entries(countMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    if (q) {
      const lower = q.toLowerCase()
      tags = tags.filter(t => t.tag.toLowerCase().includes(lower))
    }

    return NextResponse.json(tags.slice(0, 10))
  } catch (error) {
    console.error('Error searching tags:', error)
    return NextResponse.json(
      { error: 'Failed to search tags' },
      { status: 500 }
    )
  }
}
