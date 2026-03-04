import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// 将数据转换为 CSV 格式
function toCSV(data: any[], columns: { key: string; label: string }[]): string {
  // BOM for Excel UTF-8 support
  const BOM = '\uFEFF'

  // Header row
  const header = columns.map(c => `"${c.label}"`).join(',')

  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = col.key.split('.').reduce((obj, key) => obj?.[key], item)
      if (value === null || value === undefined) value = ''
      if (value instanceof Date) value = value.toISOString().slice(0, 10)
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })

  return BOM + [header, ...rows].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !['communities', 'orders', 'users'].includes(type)) {
      return NextResponse.json({ error: '无效的导出类型' }, { status: 400 })
    }

    let csv: string
    let filename: string

    switch (type) {
      case 'communities': {
        const data = await prisma.community.findMany({
          orderBy: { createdAt: 'desc' },
        })
        const columns = [
          { key: 'name', label: '社区名称' },
          { key: 'city', label: '城市' },
          { key: 'district', label: '区县' },
          { key: 'address', label: '地址' },
          { key: 'operator', label: '运营方' },
          { key: 'contactPhone', label: '联系电话' },
          { key: 'status', label: '状态' },
          { key: 'workstations', label: '工位数' },
          { key: 'createdAt', label: '创建时间' },
        ]
        csv = toCSV(data, columns)
        filename = `社区数据-${new Date().toISOString().slice(0, 10)}.csv`
        break
      }

      case 'orders': {
        const data = await prisma.project.findMany({
          where: { contentType: { in: ['DEMAND', 'COOPERATION'] } },
          include: { owner: { select: { username: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        })
        const columns = [
          { key: 'name', label: '标题' },
          { key: 'tagline', label: '描述' },
          { key: 'contentType', label: '类型' },
          { key: 'status', label: '状态' },
          { key: 'owner.username', label: '发布者' },
          { key: 'budgetType', label: '预算类型' },
          { key: 'budgetMin', label: '预算下限' },
          { key: 'budgetMax', label: '预算上限' },
          { key: 'createdAt', label: '创建时间' },
        ]
        csv = toCSV(data, columns)
        filename = `订单数据-${new Date().toISOString().slice(0, 10)}.csv`
        break
      }

      case 'users': {
        const data = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
        })
        const columns = [
          { key: 'username', label: '用户名' },
          { key: 'email', label: '邮箱' },
          { key: 'phone', label: '手机号' },
          { key: 'name', label: '昵称' },
          { key: 'role', label: '角色' },
          { key: 'verified', label: '已认证' },
          { key: 'level', label: '等级' },
          { key: 'createdAt', label: '注册时间' },
        ]
        csv = toCSV(data, columns)
        filename = `用户数据-${new Date().toISOString().slice(0, 10)}.csv`
        break
      }

      default:
        return NextResponse.json({ error: '无效的导出类型' }, { status: 400 })
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('导出数据失败:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}
