/**
 * OPC Radar 期刊生成逻辑（共享模块）
 *
 * daily-run.ts 和 /api/admin/radar/generate 共用此逻辑。
 * 包含：AI聚类打eventKey（含最优选择）、eventKey去重、每类上限、AI编辑审核、中经报保底。
 * 时效性权重已合并进 aiJudge.ts 入库时判断，此处不再单独处理。
 *
 * 更新时间：2026-05-13
 */
import { getAIClient, ISSUE_WINDOW_DAYS } from './aiJudge'

const MAX_ITEMS_PER_ISSUE = 20
const MAX_ITEMS_PER_CATEGORY = 6
const MIN_IMPORTANCE = 3
const MIN_ITEMS = 10
const MIN_CATEGORIES = 3
const AI_MODEL = 'deepseek-v4-flash'

type PrismaAny = any

interface GenerateResult {
  issueNo: number
  itemCount: number
  issueId: string
  editorialRemoved?: number
}

/**
 * Step 1: 出刊前批量 AI 聚类打 eventKey + 最优选择
 * 同事件/同主题打相同 key，每组内非最优的条目降权，确保 eventKey 去重时自然淘汰劣质条目
 */
async function clusterEventKeys(items: any[], prisma: PrismaAny, client: any): Promise<void> {
  if (items.length === 0) return

  // 查最近 3 期已出刊条目标题，用于跨期话题去重
  const recentIssues = await prisma.radarIssue.findMany({
    orderBy: { issueNo: 'desc' },
    take: 3,
    select: { issueNo: true, items: { select: { title: true, category: true } } },
  })
  const historyLines: string[] = []
  for (const issue of recentIssues) {
    for (const it of (issue.items ?? [])) {
      historyLines.push(`  [第${issue.issueNo}期/${it.category}] ${it.title}`)
    }
  }
  const historySection = historyLines.length > 0
    ? `\n\n【近3期已出刊内容（避免重复话题）】\n${historyLines.join('\n')}`
    : ''

  const list = items.map((item, i) =>
    `${i + 1}. [ID:${item.id}] [${item.category}/${item.importance}★] ${item.title}`
  ).join('\n')

  const prompt = `以下是 OPC 雷达候选条目，请完成两件事：
1. 将同一事件或同一主题系列的条目归组，每组指定一个 eventKey（5-10字）
2. 每组内选出最有价值的那条（信息最完整、最具体、来源最权威），标记 best=true，其余 best=false

完全独立的条目：eventKey=null，best=true
${historySection}

【本期候选条目】
${list}

规则：
- 同省市同政策文件的多篇报道 → 相同 key，选最完整的为 best
- 同主题讨论系列（如多篇"一人公司靠谱吗"）→ 相同 key，选观点最独特的为 best
- 同一活动/社区的多篇报道 → 相同 key，选信息最全的为 best
- 独立事件 → null
- ⚠️ 跨期去重：若候选条目与【近3期已出刊内容】中某条高度相似（同一事件/同一话题），
  则将该候选条目 best=false，并打上 eventKey（格式：HIST_关键词），使其在去重时被淘汰

只返回 JSON 数组：
[{"id": "条目ID", "eventKey": "key或null", "best": true或false}, ...]`

  try {
    const comp = await Promise.race([
      client.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 6000,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('cluster timeout')), 90000)),
    ])
    const text = (comp as any).choices[0]?.message?.content ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) { console.error('[cluster] AI 返回格式异常'); return }
    const results = JSON.parse(match[0]) as Array<{ id: string; eventKey: string | null; best: boolean }>

    let updatedKey = 0, markedNonBest = 0
    for (const r of results) {
      const data: any = {}
      if (r.eventKey) { data.eventKey = r.eventKey; updatedKey++ }
      // 非最优条目降权，eventKey 去重时自然保留最优那条
      if (r.eventKey && r.best === false) {
        const orig = items.find(i => i.id === r.id)?.importance ?? 3
        data.importance = Math.max(1, orig - 2)
        markedNonBest++
      }
      if (Object.keys(data).length > 0) {
        await prisma.radarItem.update({ where: { id: r.id }, data })
      }
    }
    console.log(`[cluster] 聚类完成：打key ${updatedKey} 条，降权非最优 ${markedNonBest} 条`)
  } catch (e: any) {
    console.error('[cluster] 聚类失败，跳过:', e?.message ?? e)
  }
}

/**
 * Step 2: AI 编辑审核（去重 + 去弱相关，最后一道防线）
 */
async function editorialReview(
  items: Array<{ id: string; title: string; summary: string | null; category: string; eventKey: string | null }>
): Promise<string[] | null> {
  const client = getAIClient()
  if (!client) return null

  const list = items.map((item, i) =>
    `${i + 1}. [ID:${item.id}] [${item.category}] ${item.title}\n   摘要：${(item.summary ?? '').slice(0, 80)}`
  ).join('\n')

  const prompt = `你是 OPC 雷达的编辑，负责最终审核本期入选条目。

候选条目列表：
${list}

请完成以下两项审核（仅此两项）：
1. **去重复**：若多条标题高度相似或明显是同一事件的不同报道，只保留最有价值的一条。
2. **去弱相关**：若某条内容与 OPC（一人公司/超级个体/独立创业/OPC社区）明显无关，标记删除。

返回 JSON（不要其他内容）：
{
  "keep": ["id1", "id2", ...],
  "remove": [{"id": "id3", "reason": "原因"}, ...]
}`

  try {
    const completion = await Promise.race([
      client.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('editorial timeout')), 30000)),
    ])
    const text = (completion as any).choices[0]?.message?.content ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) { console.error('[editorial] AI 返回格式异常:', text.slice(0, 200)); return null }
    const result = JSON.parse(match[0]) as { keep: string[]; remove: { id: string; reason: string }[] }
    if (!Array.isArray(result.keep) || result.keep.length === 0) return null

    if (result.remove?.length > 0) {
      console.log(`[editorial] 删除 ${result.remove.length} 条：`)
      for (const r of result.remove) {
        const item = items.find(i => i.id === r.id)
        console.log(`  - ${item?.title ?? r.id}：${r.reason}`)
      }
    }
    return result.keep
  } catch (e: any) {
    console.error('[editorial] AI 审核失败，fallback:', e?.message ?? e)
    return null
  }
}

/**
 * 生成新一期雷达
 */
export async function generateIssue(prisma: PrismaAny): Promise<GenerateResult | null> {
  const windowCutoff = new Date(Date.now() - ISSUE_WINDOW_DAYS * 86400000)

  // 取候选池（时效性已在入库时通过 aiJudge.ts 处理，此处直接按 importance 排序）
  const candidates = await prisma.radarItem.findMany({
    where: {
      importance: { gte: MIN_IMPORTANCE },
      issueId: null,
      collectedAt: { gte: windowCutoff },
    },
    orderBy: [{ importance: 'desc' }, { collectedAt: 'desc' }],
  })

  if (candidates.length < MIN_ITEMS) {
    console.log(`[generate] 候选池不足 ${MIN_ITEMS} 条（当前 ${candidates.length}），跳过`)
    return null
  }

  // 每日出刊上限：同一自然日（Asia/Shanghai）最多出一期
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  // UTC+8: 本地午夜 = UTC-8h
  const todayStartUTC = new Date(todayStart.getTime() - 8 * 3600000)
  const todayIssue = await prisma.radarIssue.findFirst({
    where: { createdAt: { gte: todayStartUTC } },
    select: { issueNo: true, createdAt: true },
  })
  if (todayIssue) {
    console.log(`[generate] 今日已出刊（Issue #${todayIssue.issueNo}），跳过`)
    return null
  }

  // 检查 AI 可用性（聚类和编辑审核都依赖 AI，不可用时跳过出刊保证质量）
  const aiClient = getAIClient()
  if (!aiClient) {
    console.error('[generate] ❌ AI Key 不可用，跳过本次出刊（需要 AI 保证质量）')
    return null
  }

  // Step 1: AI 聚类打 eventKey + 标记最优
  await clusterEventKeys(candidates, prisma, aiClient)

  // 聚类写回 DB 后重新取最新 importance + eventKey
  const ids = candidates.map((i: any) => i.id)
  const refreshed = await prisma.radarItem.findMany({
    where: { id: { in: ids } },
    select: { id: true, eventKey: true, importance: true },
  })
  const refreshMap = Object.fromEntries(refreshed.map((r: any) => [r.id, r]))
  const reranked = candidates
    .map((item: any) => ({
      ...item,
      eventKey: refreshMap[item.id]?.eventKey ?? item.eventKey,
      importance: refreshMap[item.id]?.importance ?? item.importance,
    }))
    .filter((item: any) => item.importance >= MIN_IMPORTANCE)
    .sort((a: any, b: any) => b.importance - a.importance || b.collectedAt - a.collectedAt)

  // Step 2: eventKey 去重（此时非最优已降权，自然排到后面被过滤）
  const seenKeys = new Set<string>()
  const keyDeduped = reranked.filter((item: any) => {
    if (!item.eventKey) return true
    if (seenKeys.has(item.eventKey)) return false
    seenKeys.add(item.eventKey)
    return true
  })

  // Step 3: 每类上限
  const catCount: Record<string, number> = {}
  const categoryLimited = keyDeduped.filter((item: any) => {
    const c = item.category
    catCount[c] = (catCount[c] ?? 0) + 1
    return catCount[c] <= MAX_ITEMS_PER_CATEGORY
  })

  // 检查出刊条件
  const catsBefore = new Set(categoryLimited.map((i: any) => i.category))
  if (categoryLimited.length < MIN_ITEMS || catsBefore.size < MIN_CATEGORIES) {
    console.log(`[generate] 去重后条目不足（${categoryLimited.length} 条，${catsBefore.size} 类），跳过`)
    return null
  }

  // Step 4: 取前 MAX_ITEMS_PER_ISSUE 条
  const preSelected = categoryLimited.slice(0, MAX_ITEMS_PER_ISSUE)

  // Step 5: AI 编辑审核（最后兜底）
  const keepIds = await editorialReview(preSelected)
  let selected = keepIds
    ? preSelected.filter((item: any) => keepIds.includes(item.id))
    : preSelected
  const editorialRemoved = preSelected.length - selected.length

  // 审核后条目不足时 fallback 到审核前列表，不放弃整期
  const catsAfter = new Set(selected.map((i: any) => i.category))
  if (selected.length < MIN_ITEMS || catsAfter.size < MIN_CATEGORIES) {
    console.log(`[generate] 审核删除过多（${selected.length} 条，${catsAfter.size} 类），fallback 到审核前列表`)
    selected = preSelected
  }

  // 保底：case 类 = 0 时从中经报离线库补一篇
  const hasCase = selected.some((item: any) => item.category === 'case')
  if (!hasCase) {
    const cbArticle = await prisma.radarCbArticle.findFirst({
      where: { used: false, collectedAt: { gte: new Date(Date.now() - 60 * 86400000) } },
      orderBy: { collectedAt: 'asc' },
    })
    if (cbArticle) {
      const newItem = await prisma.radarItem.create({
        data: {
          title: cbArticle.title, url: cbArticle.url, source: '中国经营报',
          category: 'case', importance: 3, summary: cbArticle.summary ?? null,
          publishedAt: cbArticle.collectedAt,
        },
      })
      selected.push(newItem)
      await prisma.radarCbArticle.update({ where: { id: cbArticle.id }, data: { used: true, usedAt: new Date() } })
    }
  }

  // 计算期号
  const maxIssue = await prisma.radarIssue.findFirst({ orderBy: { issueNo: 'desc' }, select: { issueNo: true } })
  const nextIssueNo = (maxIssue?.issueNo ?? 0) + 1
  const now = new Date()
  const windowStart = selected.reduce(
    (min: Date, item: any) => (item.collectedAt < min ? item.collectedAt : min),
    selected[0].collectedAt
  )
  const issueTitle = `OPC 雷达 ${now.getMonth() + 1}月第${nextIssueNo}期`

  // 生成总摘要
  let issueSummary: string | null = null
  try {
    const titles = selected.map((s: any) => `[${s.category}] ${s.title}`).join('\n')
    const summaryPrompt = `你是主编，这是新一期雷达收录的 ${selected.length} 篇文章标题：\n${titles}\n\n请用2-3句话总结这期的核心看点，提炼行业趋势，语气客观、专业。每句话必须完整，不要截断。直接输出总结段落，不要废话。`
    const comp = await Promise.race([
      aiClient.chat.completions.create({
        model: AI_MODEL, messages: [{ role: 'user', content: summaryPrompt }],
        temperature: 0.3, max_tokens: 400,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('summary timeout')), 30000)),
    ])
    issueSummary = (comp as any).choices[0]?.message?.content?.trim() || null
    if (!issueSummary) console.error('[generate] 总摘要 AI 返回为空')
  } catch (e: any) {
    console.error('[generate] 生成总摘要失败:', e?.message ?? e)
  }

  const issue = await prisma.radarIssue.create({
    data: {
      issueNo: nextIssueNo, title: issueTitle, summary: issueSummary,
      windowStart, windowEnd: now,
      items: { connect: selected.map((item: any) => ({ id: item.id })) },
    },
  })

  const catStats = Object.entries(
    selected.reduce((acc: any, i: any) => { acc[i.category] = (acc[i.category] ?? 0) + 1; return acc }, {})
  ).map(([k, v]) => `${k}:${v}`).join(' ')
  console.log(`✅ Issue #${issue.issueNo} 生成成功（${selected.length} 条 | ${catStats} | 编辑去除 ${editorialRemoved} 条）`)

  return { issueNo: issue.issueNo, itemCount: selected.length, issueId: issue.id, editorialRemoved }
}
