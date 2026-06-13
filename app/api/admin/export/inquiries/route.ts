import { NextRequest, NextResponse } from 'next/server'
import { requireStaffContextApi, cityFilter } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待跟进',
  CONTACTED: '已联系',
  DONE: '已完成',
  CANCELLED: '已取消',
}

export async function GET(request: NextRequest) {
  const staff = await requireStaffContextApi()
  if (staff instanceof NextResponse) return staff

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { ...cityFilter(staff) }
    if (status && status !== 'ALL') where.status = status

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        community: { select: { name: true } },
      },
    })

    const header = '称呼,联系方式,意向社区,城市,简介,状态,提交时间,BP文件,愿意接受采访,内部备注'
    const rows = inquiries.map((inq) => {
      const communityName = inq.community?.name || inq.communityName || ''
      const dateStr = new Date(inq.createdAt).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

      return [
        inq.name,
        inq.contact,
        communityName,
        inq.city || '',
        inq.introduction || '',
        STATUS_LABEL[inq.status] || inq.status,
        dateStr,
        inq.bpFilename || '',
        inq.acceptInterview ? '是' : '否',
        inq.adminNote || '',
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
