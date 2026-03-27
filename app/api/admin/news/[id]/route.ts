import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import { NewsCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

// 中文分类名 → enum 映射
const CATEGORY_MAP: Record<string, NewsCategory> = {
  '政策资讯': NewsCategory.POLICY,
  '创业干货': NewsCategory.STORY,
  '社区动态': NewsCategory.EVENT,
  '行业观察': NewsCategory.TECH,
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const news = await prisma.news.findUnique({
      where: { id: params.id },
    })

    if (!news) {
      return NextResponse.json({ error: '资讯不存在' }, { status: 404 })
    }

    return NextResponse.json(news)
  } catch (error) {
    console.error('获取资讯失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const { title, category, author, content, publishedAt } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    const categoryEnum: NewsCategory =
      CATEGORY_MAP[category] ||
      (Object.values(NewsCategory).includes(category as NewsCategory)
        ? (category as NewsCategory)
        : NewsCategory.STORY)

    const news = await prisma.news.update({
      where: { id: params.id },
      data: {
        title,
        category: categoryEnum,
        author: author || 'OPC圈运营团队',
        content: content || '',
        summary: (content || '').slice(0, 200),
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('更新资讯失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const { isOriginal, author } = body

    const updateData: Record<string, unknown> = {}
    if (typeof isOriginal === 'boolean') updateData.isOriginal = isOriginal
    if (typeof author === 'string') updateData.author = author

    const news = await prisma.news.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('更新资讯失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    await prisma.news.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('删除资讯失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
