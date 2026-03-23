import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  // requireAdmin 内部调用 redirect()，抛出 NextJS 特殊 error，不能在 catch 里吞掉
  await requireAdmin()

  try {
    const days = 7
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date()
      start.setDate(start.getDate() - i)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)

      const [users, posts] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.post.count({ where: { createdAt: { gte: start, lte: end }, status: 'PUBLISHED' } }),
      ])
      result.push({
        date: start.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        users,
        posts,
      })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}
