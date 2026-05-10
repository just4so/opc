import { NextResponse } from 'next/server'

/**
 * 测试 EdgeOne 节点能否直连 Google News
 * 访问：https://opcquan.com/api/test/gnews
 * 验证完删掉此文件
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = 'https://news.google.com/rss/search?q=%E4%B8%80%E4%BA%BA%E5%85%AC%E5%8F%B8&hl=zh-CN&gl=CN&ceid=CN:zh-Hans'
  const start = Date.now()

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    })

    const text = await res.text()
    const firstTitle =
      text.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/)?.[1] ??
      text.match(/<title>(.+?)<\/title>/g)?.[1]?.replace(/<\/?title>/g, '') ??
      null

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      ms: Date.now() - start,
      firstItem: firstTitle,
      verdict: res.ok ? '✅ 能直连，GNews 可迁云端' : '❌ 请求失败',
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message ?? String(e),
      ms: Date.now() - start,
      verdict: '❌ 连接超时或被拦截，GNews 不能迁云端',
    })
  }
}
