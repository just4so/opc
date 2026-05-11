/**
 * 将 RadarIssue 的 items 按 category 分组，并序列化日期为字符串
 * radar/page.tsx 和 radar/[issueNo]/page.tsx 共用，避免重复维护
 */

type RawItem = {
  id: string
  title: string
  url: string
  source: string
  summary: string | null
  category: string
  city: string | null
  importance: number
  publishedAt: Date | null
  collectedAt: Date
  createdAt: Date
  eventKey: string | null
  issueId: string | null
}

export type SerializedItem = {
  id: string
  title: string
  url: string
  source: string
  summary: string | null
  category: string
  city: string | null
  importance: number
  publishedAt: string | null
  collectedAt: string
  createdAt: string
  eventKey: string | null
  issueId: string | null
}

type RawIssue = {
  id: string
  issueNo: number
  title?: string | null
  summary?: string | null
  publishedAt: Date
  windowStart: Date
  windowEnd: Date
  items: RawItem[]
}

export type SerializedIssue = {
  id: string
  issueNo: number
  title: string | null
  summary: string | null
  publishedAt: string
  windowStart: string
  windowEnd: string
  grouped: Record<string, SerializedItem[]>
}

export function serializeIssue(issue: RawIssue): SerializedIssue {
  const grouped: Record<string, SerializedItem[]> = {}

  for (const item of issue.items) {
    const cat = item.category
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({
      ...item,
      publishedAt: item.publishedAt?.toISOString() ?? null,
      collectedAt: item.collectedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    })
  }

  return {
    id: issue.id,
    issueNo: issue.issueNo,
    title: issue.title ?? null,
    summary: issue.summary ?? null,
    publishedAt: issue.publishedAt.toISOString(),
    windowStart: issue.windowStart.toISOString(),
    windowEnd: issue.windowEnd.toISOString(),
    grouped,
  }
}
