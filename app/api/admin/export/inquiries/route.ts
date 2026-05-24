import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待跟进',
  CONTACTED: '已联系',
  DONE: '已完成',
  CANCELLED: '已取消',
}

export async function GET(request: NextRequest) {
  await requireStaff()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        community: { select: { name: true } },
      },
    })

    const header = '称呼,联系方式,意向社区,城市,方向,阶段,状态,提交时间'
    const rows = inquiries.map((inq) => {
      const communityName = inq.community?.name || inq.communityName || ''
      const date = new Date(inq.createdAt)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

      return [
        inq.name,
        inq.contact,
        communityName,
        inq.city || '',
        inq.introduction || '',
        inq.stage || '',
        STATUS_LABEL[inq.status] || inq.status,
        dateStr,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    })

    const csv = '﻿' + header + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inquiries-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error('导出意向数据失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
