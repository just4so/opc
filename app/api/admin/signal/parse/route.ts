import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/admin'
import { parseSignalHtml } from '@/lib/signal/parse'

export async function POST(req: Request) {
  const staff = await requireStaffApi()
  if (staff instanceof NextResponse) return staff

  const body = await req.json().catch(() => ({}))
  const { html } = body

  if (!html || typeof html !== 'string') {
    return NextResponse.json({ error: '缺少 html 参数' }, { status: 400 })
  }

  try {
    const data = await parseSignalHtml(html)
    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : '解析失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
