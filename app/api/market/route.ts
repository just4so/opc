import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 合作广场已迁移至交流广场(/plaza)，此接口保留为空以避免404
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    data: [],
    pagination: {
      page: 1,
      limit: 24,
      total: 0,
      totalPages: 0,
    },
  })
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: '合作广场已迁移至交流广场，请使用 /plaza/new 发帖' },
    { status: 410 }
  )
}
