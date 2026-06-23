/**
 * OPC Radar 期刊生成逻辑（共享模块）
 *
 * daily-run.ts 和 /api/admin/radar/generate 共用此逻辑。
 * 包含：AI跨期重复判断（duplicate）、候选池内同话题去重、每类上限、AI编辑审核、中经报保底。
 * 时效性权重已合并进 aiJudge.ts 入库时判断，此处不再单独处理。
 *
 * 更新时间：2026-05-25
 */
import { execSync } from 'child_process'
import { getAIClient, ISSUE_WINDOW_DAYS } from './aiJudge'

const MAX_ITEMS_PER_ISSUE = 12
const MAX_ITEMS_PER_CATEGORY = 4
const MIN_IMPORTANCE = 3
const MIN_ITEMS = 8
const MIN_CATEGORIES = 3
const AI_MODEL = 'deepseek-v4-flash'
const CLUSTER_MODEL = 'deepseek-chat'  // 聚类用非推理模型，避免 reasoning tokens 耗尽

type PrismaAny = any

interface GenerateResult {
  issueNo: number
  itemCount: number
  issueId: string
  editorialRemoved?: number
}

/**
 * Step 1: 出刊前 AI 重复判断
 * 同时做两件事：(1) 标记与近5期已出刊内容重复的条目；(2) 候选池内同话题只保留最优一条
 */
async function clusterEventKeys(items: any[], prisma: PrismaAny, client: any): Promise<void> {
  if (items.length === 0) return

  // 查最近 5 期已出刊条目标题，用于跨期话题去重
  const recentIssues = await prisma.radarIssue.findMany({
    orderBy: { issueNo: 'desc' },
    take: 5,
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

  const prompt = `你是 OPC 雷达编辑，对以下候选条目做两步判断：

**第一步：跨期去重**
若候选条目与近5期已出刊内容报道的是同一事件/同一政策文件/同一话题，标记 duplicate=true。
判断标准：同省份 + 同政策关键词，或同一人物/案例的不同报道角度，视为重复。
${historySection}

**第二步：候选池内去重**
若多条候选条目报道同一事件，只保留信息最完整、来源最权威的那条（keep=true），其余 keep=false。

【本期候选条目】
${list}

返回 JSON 数组（每条必须有 id、duplicate、keep）：
[{"id": "条目ID", "duplicate": true或false, "keep": true或false}]

说明：
- duplicate=true → 该条与历史已出刊内容重复，降权处理
- keep=false → 该条在候选池内被同话题更优质条目覆盖，降权处理
- 独立事件：duplicate=false，keep=true`

  try {
    const comp = await Promise.race([
      client.chat.completions.create({
        model: CLUSTER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 3000,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('cluster timeout')), 40000)),
    ])
    const text = (comp as any).choices[0]?.message?.content ?? ''
    const finishReason = (comp as any).choices[0]?.finish_reason
    const usage = (comp as any).usage
    console.log(`[cluster] finish_reason=${finishReason} text_len=${text.length} usage=${JSON.stringify(usage)}`)
    if (text.length < 10) { console.error('[cluster] AI 返回为空，跳过'); return }
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) { console.error('[cluster] AI 返回格式异常，末尾:', JSON.stringify(text.slice(-300))); return }
    const results = JSON.parse(match[0]) as Array<{ id: string; duplicate: boolean; keep: boolean }>

    let markedDup = 0, markedNonKeep = 0
    for (const r of results) {
      const orig = items.find(i => i.id === r.id)?.importance ?? 3
      // duplicate=true（与历史重复）降到1；keep=false（池内被覆盖）降2分
      const newImportance = r.duplicate
        ? 1
        : !r.keep
          ? Math.max(1, orig - 2)
          : null
      if (newImportance !== null) {
        await prisma.radarItem.update({ where: { id: r.id }, data: { importance: newImportance } })
        if (r.duplicate) markedDup++
        else markedNonKeep++
      }
    }
    console.log(`[dedup] 完成：跨期重复降权 ${markedDup} 条，池内覆盖降权 ${markedNonKeep} 条`)
  } catch (e: any) {
    console.error('[cluster] 聚类失败，跳过:', e?.message ?? e)
  }
}

/**
 * Step 2: AI 编辑审核（去重 + 去弱相关，最后一道防线）
 */
async function editorialReview(
  items: Array<{ id: string; title: string; summary: string | null; category: string }>
): Promise<string[] | null> {
  const client = getAIClient()
  if (!client) return null

  const list = items.map((item, i) =>
    `${i + 1}. [ID:${item.id}] [${item.category}] ${item.title}\n   摘要：${(item.summary ?? '').slice(0, 80)}`
  ).join('\n')

  const prompt = `你是 OPC 雷达的编辑，负责最终把关本期内容质量。

候选条目（去重已完成，聚焦做一件事）：
${list}

**只做一件事：去弱相关**
将以下情况的条目标记删除（removal reason 必须具体说明）：
- 与 OPC/一人公司/超级个体/独立创业/OPC社区 明显无关
- 内容是大公司发布会/企业动态，蹭 OPC 热点但对独立创业者无实际参考价值
- 明显软文/广告，信息密度为零

**保留原则**：只要内容对 OPC 创业者有信息价值，即使话题相似也都保留。

返回 JSON（不要其他内容）：
{
  "keep": ["id1", "id2", ...],
  "remove": [{"id": "id3", "reason": "原因（具体说明为何无关或无价值）"}, ...]
}`

  try {
    const completion = await Promise.race([
      client.chat.completions.create({
        model: CLUSTER_MODEL,  // 编辑审核无需推理，用非推理模型避免 tokens 耗尽
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
 * Step 0: 摘要补强——对摘要过短的条目抓正文重写摘要
 * 只在出刊前调用，不影响采集流程
 */
async function enrichSummaries(
  items: Array<{ id: string; title: string; url: string; summary: string | null }>,
  prisma: PrismaAny
): Promise<void> {
  const client = getAIClient()
  if (!client) return

  // 并发抓取+重写，最多同时 5 个
  const CONCURRENCY = 5
  let idx = 0
  let enriched = 0

  async function worker() {
    while (idx < items.length) {
      const i = idx++
      const item = items[i]
      try {
        // 抓正文（取前 2000 字）——用 curl 避免 Node.js fetch 在代理环境下 TCP 挂起
        const PROXY = process.env.HTTP_PROXY || 'http://127.0.0.1:7898'
        let html = ''
        try {
          html = execSync(
            `curl -sL --max-time 8 -A "Mozilla/5.0 (compatible; OPCRadarBot/1.0)" -x "${PROXY}" "${item.url}"`,
            { encoding: 'utf-8', timeout: 10000 }
          )
        } catch {
          console.log(`  [enrich] ${item.title.slice(0, 30)}... fetch failed`); continue
        }
        // 粗涂提取正文：去 HTML 标签，取前 2000 字
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-zA-Z]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2000)

        // AI 重写摘要（正文太短时用标题兜底，不跳过）
        const textForPrompt = text.length >= 100 ? text : '（正文无法获取，请基于标题改写摘要）'
        if (text.length < 100) { console.log(`  [enrich] ${item.title.slice(0, 30)}... 正文太短(${text.length}字), 改用标题兜底`) }

        const prompt = `你是 OPC 雷达编辑，基于以下文章正文，写一句摘要（30-80字）。

要求：
- 提炼最具体的 1-2 个事实（金额/城市/人物/数字/措施名）
- 禁止写「旨在推动」「提供支持」「有重要意义」等空话
- 原文无具体信息时，用一句话改写标题核心内容作为摘要，不要返回 null
- 只返回摘要文本，不加引号、不加前缀

标题：${item.title}
正文：${textForPrompt}`

        const comp = await Promise.race([
          client!.chat.completions.create({
            model: CLUSTER_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 200,
          }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('enrich AI timeout')), 15000)),
        ])
        const newSummary = (comp as any).choices[0]?.message?.content?.trim()
        // 过滤 AI 兜底失败时写回的无效占位符（这类字符串长度≥20但内容无效，会干扰质量过滤）
        const INVALID_PATTERNS = ['未提取到', '无法生成', '需查阅原文', '正文无法获取', '无具体信息']
        const isInvalid = !newSummary || newSummary === 'null' || newSummary.length < 20
          || INVALID_PATTERNS.some(p => newSummary.includes(p))
        if (!isInvalid) {
          await prisma.radarItem.update({ where: { id: item.id }, data: { summary: newSummary } })
          enriched++
          console.log(`  [enrich] ✓ ${item.title.slice(0, 30)}... → ${newSummary.slice(0, 60)}`)
        } else {
          console.log(`  [enrich] ${item.title.slice(0, 30)}... AI 返回无效摘要, 跳过`)
        }
      } catch (e: any) {
        console.log(`  [enrich] ${item.title.slice(0, 30)}... 失败: ${e.message?.slice(0, 60)}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
  console.log(`[enrich] 完成：${enriched}/${items.length} 条摘要已补强`)
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

  // Step 0: 摘要补强——对摘要过短或过长（原文截取）的候选条目抓正文重写摘要
  const MIN_SUMMARY_LEN = 15  // 从30降到15，避免合法短摘要被误杀（2026-06-23）
  const MAX_SUMMARY_LEN = 200  // 超过200字也是问题——说明是RSS原文截取，不是提炼
  const weakSummaryItems = candidates.filter(
    (item: any) => !item.summary || item.summary.trim().length < MIN_SUMMARY_LEN || item.summary.trim().length > MAX_SUMMARY_LEN
  )
  if (weakSummaryItems.length > 0) {
    console.log(`[generate] 发现 ${weakSummaryItems.length} 条摘要过短，尝试抓正文补强...`)
    await enrichSummaries(weakSummaryItems, prisma)
  }

  // 摘要质量过滤：补强后仍然为空或 < 15 字的条目不进入出刊候选
  // 重新从 DB 读取最新 summary（enrichSummaries 已写回）
  const refreshedCandidates = await prisma.radarItem.findMany({
    where: { id: { in: candidates.map((i: any) => i.id) } },
  })
  const refreshedMap = Object.fromEntries(refreshedCandidates.map((r: any) => [r.id, r]))
  const qualityFiltered = candidates
    .map((item: any) => ({ ...item, summary: refreshedMap[item.id]?.summary ?? item.summary }))
    .filter((item: any) => item.summary && item.summary.trim().length >= MIN_SUMMARY_LEN)

  const summaryDropped = candidates.length - qualityFiltered.length
  if (summaryDropped > 0) {
    console.log(`[generate] 摘要质量过滤：排除 ${summaryDropped} 条摘要过短/为空的条目（剩余 ${qualityFiltered.length}）`)
  }

  if (qualityFiltered.length < MIN_ITEMS) {
    console.log(`[generate] 质量过滤后不足 ${MIN_ITEMS} 条（当前 ${qualityFiltered.length}），跳过`)
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

  // Step 1: AI 重复判断（跨期去重 + 池内去重）
  await clusterEventKeys(qualityFiltered, prisma, aiClient)

  // 重复判断写回 DB 后重新取最新 importance
  const ids = qualityFiltered.map((i: any) => i.id)
  const refreshed = await prisma.radarItem.findMany({
    where: { id: { in: ids } },
    select: { id: true, importance: true },
  })
  const refreshMap = Object.fromEntries(refreshed.map((r: any) => [r.id, r]))
  // Step 2: 按最新 importance 重新排序，降权条目自然排到后面
  // 同等 importance 时：policy > case > opinion > community > event
  const CATEGORY_ORDER: Record<string, number> = { policy: 0, case: 1, opinion: 2, community: 3, event: 4 }
  const keyDeduped = qualityFiltered
    .map((item: any) => ({
      ...item,
      importance: refreshMap[item.id]?.importance ?? item.importance,
    }))
    .filter((item: any) => item.importance >= MIN_IMPORTANCE)
    .sort((a: any, b: any) =>
      b.importance - a.importance ||
      (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9) ||
      b.collectedAt - a.collectedAt
    )

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

      if (!newItem.summary || newItem.summary.trim().length > 200) {
        await enrichSummaries([{ id: newItem.id, title: newItem.title, url: newItem.url, summary: newItem.summary }], prisma)
        const refreshed = await prisma.radarItem.findUnique({ where: { id: newItem.id }, select: { id: true, title: true, summary: true, category: true, importance: true, url: true, publishedAt: true } })
        if (refreshed) selected[selected.length - 1] = refreshed
      }
    }
  }

  // 计算期号
  const maxIssue = await prisma.radarIssue.findFirst({ orderBy: { issueNo: 'desc' }, select: { issueNo: true } })
  const nextIssueNo = (maxIssue?.issueNo ?? 0) + 1
  const now = new Date()
  // 当月内计数（显示用，不影响 URL）
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) + 8 * 3600000)
  monthStart.setUTCHours(0, 0, 0, 0)
  const monthStartUTC = new Date(monthStart.getTime() - 8 * 3600000)
  const monthlyCount = await prisma.radarIssue.count({ where: { createdAt: { gte: monthStartUTC } } })
  const monthlyNo = monthlyCount + 1
  const windowStart = selected.reduce(
    (min: Date, item: any) => (item.collectedAt < min ? item.collectedAt : min),
    selected[0].collectedAt
  )
  const issueTitle = `OPC 雷达 ${now.getMonth() + 1}月第${monthlyNo}期`

  // 生成总摘要
  let issueSummary: string | null = null
  try {
    // 输入分层：policy 优先，给 AI 明确的宏观→微观线索
    const policyItems = selected
      .filter((s: any) => s.category === 'policy')
      .sort((a: any, b: any) => b.importance - a.importance)
    const nonPolicyItems = selected
      .filter((s: any) => s.category !== 'policy')
      .sort((a: any, b: any) => b.importance - a.importance)

    const policyLines = policyItems
      .map((s: any) => `[政策] ${s.title}\n  要点：${(s.summary || '').slice(0, 100)}`)
      .join('\n')
    const caseLines = nonPolicyItems
      .slice(0, 4)
      .map((s: any) => `[${s.category}] ${s.title}\n  要点：${(s.summary || '').slice(0, 80)}`)
      .join('\n')

    const policySection = policyLines
      ? `【本期政策层（宏观信号，必须优先体现）】\n${policyLines}`
      : '【本期无政策类条目，直接用最高分条目开头】'
    const caseSection = `【本期案例/观点层（市场佐证）】\n${caseLines}`

    const summaryPrompt = `你是 OPC 雷达主编，为本期写 2-3 句导读，帮读者决定是否值得读这期。

${policySection}

${caseSection}

【写作规则】

第1句：
- 有政策条目时：以政策开头，直接点出「发布方 + 最核心措施 + 文中出现的具体数字或名称」
- 无政策条目时：以本期 importance 最高的条目核心事实开头，直接陈述该条目的人物/事件/地点

第2句：
- 从【本期案例/观点层】中选取 1-2 个已有的具体事实（人名/地名/数字），串联成一句
- 如果案例层没有具体数字，只描述事件本身，不要补充或推断数字

第3句（可选）：
- 仅在本期有明确方向判断时加，≤20字
- 没有则省略，不强行凑句

【绝对禁止】
- 禁止出现「某城市」「某创业者」「某人」「某赛道」等模糊表述，必须用真实名称
- 禁止编造任何数字，只能用上方条目摘要中明确出现的数字
- 禁止「各地政策密集出台」「显示出趋势」「标志着新阶段」「正在兴起」等套话
- 禁止加标题、序号、引号括号

直接输出导读正文，不加任何前缀。`
    const comp = await Promise.race([
      aiClient.chat.completions.create({
        model: CLUSTER_MODEL, messages: [{ role: 'user', content: summaryPrompt }],
        temperature: 0.3, max_tokens: 200,  // 非推理模型，200 tokens 够两句话
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('summary timeout')), 30000)),
    ])
    issueSummary = (comp as any).choices[0]?.message?.content?.trim() || null
    if (!issueSummary) console.error('[generate] 总摘要 AI 返回为空')
  } catch (e: any) {
    console.error('[generate] 生成总摘要失败:', e?.message ?? e)
  }

  let issue: any
  try {
    issue = await prisma.radarIssue.create({
      data: {
        issueNo: nextIssueNo, title: issueTitle, summary: issueSummary,
        windowStart, windowEnd: now,
        items: { connect: selected.map((item: any) => ({ id: item.id })) },
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      console.log(`[generate] issueNo=${nextIssueNo} 已存在（并发写入冲突），跳过`)
      return null
    }
    throw e
  }

  const catStats = Object.entries(
    selected.reduce((acc: any, i: any) => { acc[i.category] = (acc[i.category] ?? 0) + 1; return acc }, {})
  ).map(([k, v]) => `${k}:${v}`).join(' ')
  console.log(`✅ Issue #${issue.issueNo} 生成成功（${selected.length} 条 | ${catStats} | 编辑去除 ${editorialRemoved} 条）`)

  return { issueNo: issue.issueNo, itemCount: selected.length, issueId: issue.id, editorialRemoved }
}
