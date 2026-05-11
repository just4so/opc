import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const revalidate = 300 // 5 分钟缓存

export async function GET() {
  const latestIssues = await prisma.radarIssue.findMany({
    orderBy: { issueNo: 'desc' },
    take: 10,
    include: {
      items: {
        orderBy: [{ importance: 'desc' }, { collectedAt: 'desc' }],
      },
    },
  })

  const siteUrl = 'https://opcquan.com'

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>OPC 雷达 - OPC创业圈</title>
  <link>${siteUrl}/radar</link>
  <description>一人公司、超级个体与独立创业者的政策、社区与实战案例监测引擎。</description>
  <language>zh-CN</language>
  <atom:link href="${siteUrl}/radar/feed.xml" rel="self" type="application/rss+xml" />
`

  for (const issue of latestIssues) {
    const pubDate = issue.publishedAt.toUTCString()
    const link = `${siteUrl}/radar/${issue.issueNo}`
    const title = issue.title || `OPC 雷达 第 ${issue.issueNo} 期`
    
    let description = ''
    if (issue.summary) {
      description += `<p><strong>本期看点：</strong>${issue.summary}</p><hr/>`
    }
    
    description += '<ul>'
    for (const item of issue.items) {
      description += `<li><a href="${item.url}">[${item.source}] ${item.title}</a><br/>${item.summary || ''}</li>`
    }
    description += '</ul>'

    rss += `  <item>
    <title>${title}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${description}]]></description>
  </item>
`
  }

  rss += `</channel>\n</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate',
    },
  })
}