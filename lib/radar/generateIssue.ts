/**
 * OPC Radar 期刊生成逻辑（共享模块）
 *
 * daily-run.ts 和 /api/admin/radar/generate 共用此逻辑。
 * 包含：AI 编辑审核、eventKey 去重、中经报保底、时间窗口过滤。
 *
 * 更新时间：2026-05-10
 */
import OpenAI from 'openai'
import { getAIClient, ISSUE_WINDOW_DAYS } from './aiJudge'

const MAX_ITEMS_PER_ISSUE = 20
const MIN_IMPORTANCE = 3
const MIN_ITEMS = 5  // 至少 5 条才生成（原 3 太少）
const MIN_CATEGORIES = 2  // 至少覆盖 2 个分类

type PrismaAny = any  // 避免 import 循环

interface GenerateResult {
  issueNo: number
  itemCount: number
  issueId: string
  editorialRemoved?: number
}

/**
 * AI 编辑审核：去重复 + 去弱相关
 * 失败时返回 null，调用方 fallback 到原始列表
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

请完成以下两项审核（仅此两项，不做其他处理）：
1. **去重复**：若多条标题高度相似、或明显是同一事件的不同报道，只保留最有价值的一条，其余标记为删除。
2. **去弱相关**：若某条内容与 OPC（一人公司/超级个体/独立创业/OPC社区）明显无关，标记为删除。

不要调整分类比例，不要合并观点类文章，不要因内容相似但非重复而删除。

返回 JSON（不要其他内容）：
{
  "keep": ["id1", "id2", ...],
  "remove": [{"id": "id3", "reason": "与上条同事件重复"}, ...]
}`

  try {
    const completion = await Promise.race([
      client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('editorial review timeout')), 30000)
      ),
    ])
    const text = (completion as any).choices[0]?.message?.content ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
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
  } catch (e) {
    console.error('[editorial] AI 审核失败，fallback:', e)
    return null
  }
}

/**
 * 生成新一期雷达
 * @param prisma - PrismaClient 实例
 * @returns 生成结果，或 null（条目不足）
 */
export async function generateIssue(prisma: PrismaAny): Promise<GenerateResult | null> {
  // 时间窗口：只取 ISSUE_WINDOW_DAYS 内采集的条目
  const windowCutoff = new Date(Date.now() - ISSUE_WINDOW_DAYS * 86400000)

  const candidates = await prisma.radarItem.findMany({
    where: {
      importance: { gte: MIN_IMPORTANCE },
      issueId: null,
      collectedAt: { gte: windowCutoff },
    },
    orderBy: [{ importance: 'desc' }, { collectedAt: 'desc' }],
  })

  if (candidates.length < MIN_ITEMS) {
    console.log(`[generate] 条目不足 ${MIN_ITEMS} 条（当前 ${candidates.length}），跳过`)
    return null
  }

  // eventKey 去重
  const seenKeys = new Set<string>()
  const deduplicated = candidates.filter((item: any) => {
    if (!item.eventKey) return true
    if (seenKeys.has(item.eventKey)) return false
    seenKeys.add(item.eventKey)
    return true
  })

  // 取前 MAX_ITEMS_PER_ISSUE 条
  const preSelected = deduplicated.slice(0, MAX_ITEMS_PER_ISSUE)

  // AI 编辑审核
  const keepIds = await editorialReview(preSelected)
  let selected = keepIds
    ? preSelected.filter((item: any) => keepIds.includes(item.id))
    : preSelected
  const editorialRemoved = preSelected.length - selected.length

  // 检查分类覆盖度
  const categories = new Set(selected.map((i: any) => i.category))
  if (selected.length < MIN_ITEMS || categories.size < MIN_CATEGORIES) {
    console.log(`[generate] 审核后条目不足或分类不够（${selected.length} 条，${categories.size} 类），跳过`)
    return null
  }

  // 保底：content 类 = 0 时从中经报离线库补一篇
  const hasContent = selected.some((item: any) => item.category === 'content')
  if (!hasContent) {
    const cbArticle = await prisma.radarCbArticle.findFirst({
      where: {
        used: false,
        // 中经报保底也加时间限制：60 天内
        collectedAt: { gte: new Date(Date.now() - 60 * 86400000) },
      },
      orderBy: { collectedAt: 'asc' },
    })
    if (cbArticle) {
      const newItem = await prisma.radarItem.create({
        data: {
          title: cbArticle.title,
          url: cbArticle.url,
          source: '中国经营报',
          category: 'content',
          importance: 3,
          summary: cbArticle.summary ?? null,
          publishedAt: cbArticle.collectedAt,
        },
      })
      selected.push(newItem)
      await prisma.radarCbArticle.update({
        where: { id: cbArticle.id },
        data: { used: true, usedAt: new Date() },
      })
    }
  }

  // 计算期号（MAX+1）
  const maxIssue = await prisma.radarIssue.findFirst({
    orderBy: { issueNo: 'desc' },
    select: { issueNo: true },
  })
  const nextIssueNo = (maxIssue?.issueNo ?? 0) + 1

  const now = new Date()
  const windowStart = selected.reduce(
    (min: Date, item: any) => (item.collectedAt < min ? item.collectedAt : min),
    selected[0].collectedAt
  )

  const issueMonth = now.getMonth() + 1
  const issueTitle = `OPC 雷达 ${issueMonth}月第${nextIssueNo}期`

  let issueSummary = null
  try {
    const aiClient = getAIClient()
    if (aiClient) {
      const titles = selected.map((s: any) => `[${s.category}] ${s.title}`).join('\n')
      const prompt = `你是主编，这是新一期雷达收录的 ${selected.length} 篇文章标题：\n${titles}\n\n请用1-2句话（100-150字以内）总结这期的核心看点，提炼行业趋势，语气客观、专业。不要任何废话，直接输出总结段落。`
      const comp = await aiClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      })
      issueSummary = (comp as any).choices[0]?.message?.content?.trim() || null
    }
  } catch (e) {
    console.log('[editorial] 生成总摘要失败:', e)
  }

  const issue = await prisma.radarIssue.create({
    data: {
      issueNo: nextIssueNo,
      title: issueTitle,
      summary: issueSummary,
      windowStart,
      windowEnd: now,
      items: { connect: selected.map((item: any) => ({ id: item.id })) },
    },
  })

  return {
    issueNo: issue.issueNo,
    itemCount: selected.length,
    issueId: issue.id,
    editorialRemoved,
  }
}
