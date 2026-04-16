import { NextResponse } from 'next/server'

// newSlug 字段已删除，所有社区 slug 统一为英文，此接口不再返回重定向目标
export async function GET() {
  return NextResponse.json({ newSlug: null })
}
