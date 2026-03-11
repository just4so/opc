import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const body = await request.json()
    const { title, category, author, content, publishedAt } = body

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    // 映射分类
    const categoryEnum: NewsCategory =
      CATEGORY_MAP[category] ||
      (Object.values(NewsCategory).includes(category as NewsCategory)
        ? (category as NewsCategory)
        : NewsCategory.STORY)

    // url 字段有 @unique 约束，原创文章用唯一占位符
    const uniqueUrl = `original-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const news = await prisma.news.create({
      data: {
        title,
        url: uniqueUrl,
        source: 'OPC圈原创',
        category: categoryEnum,
        author: author || 'OPC圈运营团队',
        content: content || '',
        isOriginal: true,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        summary: (content || '').slice(0, 200),
      },
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('创建资讯失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
