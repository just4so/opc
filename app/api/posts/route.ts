import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')
    const topic = searchParams.get('topic')
    const pinned = searchParams.get('pinned')
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      status: 'PUBLISHED',
    }

    if (type) {
      where.type = type
    }

    if (topic) {
      where.topics = { has: topic }
    }

    if (pinned === 'true') {
      where.pinned = true
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy:
          sort === 'hot'
            ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
            : sort === 'comments'
              ? [{ commentCount: 'desc' as const }, { createdAt: 'desc' as const }]
              : [{ pinned: 'desc' as const }, { createdAt: 'desc' as const }],
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              level: true,
              verified: true,
              location: true,
              mainTrack: true,
              startupStage: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    const postsWithCount = posts.map(post => ({
      ...post,
      commentCount: post._count.comments,
    }))

    return NextResponse.json({
      data: postsWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, type, topics, images } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '内容不能为空' },
        { status: 400 }
      )
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: '内容不能超过5000字' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        content,
        type: type || 'DAILY',
        topics: topics || [],
        images: images || [],
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
