import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { auth } from '@/lib/auth'
import sanitizeHtml from 'sanitize-html'

export const dynamic = 'force-dynamic'

const ALLOWED_HTML_TAGS = [
  'p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li',
  'a', 'img', 'blockquote', 'pre', 'code',
]

const ALLOWED_HTML_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
}

function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: ALLOWED_HTML_ATTRS,
  })
}

function stripTags(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type')
    const topic = searchParams.get('topic')
    const pinned = searchParams.get('pinned')
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

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
          project: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    const isAuthed = !!session?.user?.id

    const postsWithCount = posts.map(post => ({
      ...post,
      commentCount: post._count.comments,
      contactInfo: isAuthed ? post.contactInfo : null,
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
    const {
      contentHtml,
      type,
      topics,
      images,
      title,
      budgetMin,
      budgetMax,
      budgetType,
      deadline,
      skills,
      contactInfo,
      contactType,
      milestone,
      projectId,
    } = body

    if (!contentHtml || contentHtml.trim().length === 0) {
      return NextResponse.json(
        { error: '内容不能为空' },
        { status: 400 }
      )
    }

    const cleanHtml = sanitize(contentHtml)
    const plainContent = stripTags(cleanHtml)

    if (plainContent.length > 5000) {
      return NextResponse.json({ error: '内容不能超过5000字' }, { status: 400 })
    }

    const VALID_TYPES = ['SHARE', 'DEMAND', 'CHAT']
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: '无效的帖子类型' }, { status: 400 })
    }

    let validatedProjectId: string | null = null
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: session.user.id },
        select: { id: true },
      })
      if (!project) {
        return NextResponse.json({ error: '关联产品不存在或不属于你' }, { status: 400 })
      }
      validatedProjectId = project.id
    }

    const post = await prisma.post.create({
      data: {
        content: plainContent,
        contentHtml: cleanHtml,
        type: type || 'CHAT',
        topics: topics || [],
        images: images || [],
        title: title?.trim() || null,
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        budgetType: budgetType || null,
        deadline: deadline ? new Date(deadline) : null,
        skills: skills || [],
        contactInfo: contactInfo?.trim() || null,
        contactType: contactType || null,
        projectId: validatedProjectId,
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
