import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: '产品不存在' }, { status: 404 })
  }

  const comments = await prisma.comment.findMany({
    where: { projectId: project.id, parentId: null },
    include: {
      author: {
        select: { id: true, username: true, name: true, avatar: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, username: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const serialized = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
    replies: c.replies.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
    })),
  }))

  return NextResponse.json({ comments: serialized })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { slug } = await params
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) {
    return NextResponse.json({ error: '产品不存在' }, { status: 404 })
  }

  const body = await request.json()
  const { content, parentId } = body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
  }

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: '评论内容过长' }, { status: 400 })
  }

  let parent: { id: string; authorId: string; projectId: string | null } | null = null
  if (parentId) {
    parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, authorId: true, projectId: true },
    })
    if (!parent || parent.projectId !== project.id) {
      return NextResponse.json({ error: '回复的评论不存在' }, { status: 404 })
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      projectId: project.id,
      authorId: session.user.id,
      parentId: parentId || null,
    },
    include: {
      author: {
        select: { id: true, username: true, name: true, avatar: true },
      },
    },
  })

  await prisma.project.update({
    where: { id: project.id },
    data: { commentCount: { increment: 1 } },
  })

  try {
    if (parentId && parent) {
      if (parent.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: parent.authorId,
            type: 'PROJECT_COMMENT_REPLIED',
            title: '有人回复了你的评论',
            content: comment.content.slice(0, 100),
            relatedId: slug,
          },
        })
      }
    } else {
      if (project.ownerId && project.ownerId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: project.ownerId,
            type: 'PROJECT_COMMENTED',
            title: `有人评论了你的产品「${project.name}」`,
            content: comment.content.slice(0, 100),
            relatedId: slug,
          },
        })
      }
    }
    // 通知所有点赞该产品的用户（排除产品作者、排除评论者自己）
    const commenterId = session.user.id
    const likers = await prisma.favorite.findMany({
      where: {
        projectId: project.id,
        userId: {
          not: { in: [commenterId, project.ownerId].filter(Boolean) as string[] },
        },
      },
      select: { userId: true },
    })

    if (likers.length > 0) {
      await prisma.notification.createMany({
        data: likers.map(({ userId: likerId }) => ({
          userId: likerId,
          type: 'PROJECT_NEW_COMMENT',
          title: `你点赞的产品「${project.name}」有了新评论`,
          content: content.trim().slice(0, 100),
          relatedId: slug,
        })),
        skipDuplicates: true,
      })
    }
  } catch {}

  return NextResponse.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author,
    replies: [],
  })
}
