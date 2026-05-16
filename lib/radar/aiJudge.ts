/**
 * OPC Radar 统一 AI 判断模块
 *
 * 所有采集路径（Google News / RSS / 手动）共用同一套规则。
 * 修改规则只需改这一个文件。
 *
 * 更新时间：2026-05-10
 */
import OpenAI from 'openai'

// ─── 类型 ──────────────────────────────────────────────────────────────────

export interface AIResult {
  relevant: boolean
  summary?: string | null
  category?: string
  city?: string | null
  importance?: number
  is_recent?: boolean
  estimated_date?: string | null
}

export interface JudgeInput {
  title: string
  content: string       // RSS description 或 Google News 摘要，500 字以内
  url: string
  publishedAt?: string  // ISO date string 或 '未知'
  baseImportanceBonus?: number  // RSS guaranteed 源的加分
}

// ─── 配置 ──────────────────────────────────────────────────────────────────

const AI_MODEL = 'deepseek-v4-flash'
const AI_TIMEOUT_MS = 20000
const AI_BASE_URL = 'https://api.deepseek.com'

/** 入库时间窗口：超过此天数的文章直接丢弃 */
export const MAX_AGE_DAYS = 30

/** 入期时间窗口：只取此天数内采集的条目 */
export const ISSUE_WINDOW_DAYS = 7

// ─── AI Client ─────────────────────────────────────────────────────────────

export function getAIClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.KUNPO_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ baseURL: AI_BASE_URL, apiKey })
}

// ─── Prompt ────────────────────────────────────────────────────────────────

function buildPrompt(input: JudgeInput): string {
  return `你是 OPC 行业信号分析师，负责筛选与「OPC（一人公司）/超级个体/独立创业」相关的内容信号。

标题：${input.title}
摘要：${input.content.slice(0, 500)}
来源：${input.url}
发布日期：${input.publishedAt ?? '未知'}

判断规则：
- relevant=true：主题与 OPC/一人公司/超级个体/独立创业/OPC社区 有直接关联
- relevant=false：纯商业地产广告、与创业完全无关的科技产品发布、娱乐内容、宏观经济数据（CPI/股市/房产）、与 OPC 无直接关联的大公司新闻
- 重要：如果内容只是「泛创业」或「泛科技」，与 OPC/一人公司/超级个体没有直接关联，importance 必须 ≤ 2
- 大公司（360/百度/阿里等）内部政策、发布会，即使提到「超级个体」，importance 必须 ≤ 2（不是 OPC 创业者的直接信号）

请返回 JSON（不要其他内容）：
{
  "relevant": true或false,
  "summary": "提炼原文最具体的1-2个事实（金额/城市/人物/数字/措施名）；原文无具体信息时填null；禁止写「旨在推动」「提供支持」「有重要意义」等空话",
  "category": "policy（政策动向）|community（社区动态）|event（活动赛事）|case（实战案例，含创业者故事/痛点分析/行业洞察深度内容）|opinion（新锐观点，观点评论类短文）",
  "city": "城市名或null（全国性内容填null）",
  "importance": 1到5的整数,
  "is_recent": true或false,
  "estimated_date": "YYYY-MM-DD格式的推断发布日期，或null"
}

importance 分级（按 category 细化，务必严格执行）：

policy（政策）：
5 = 国家级政策 / 含具体金额的重大补贴
4 = 省市级政策文件 / 园区专项扶持（有明确措施）
3 = 园区级公告 / 信息密度一般的政策解读
2 = 泛创业政策（未明确提OPC/一人公司） / 信息密度低
1 = 旧文 / 纯广告

community（社区）：
5 = 一线城市标杆社区开业 / 大型OPC生态平台落地
4 = 省会城市 / 有背景机构的新社区开业或重要动态
3 = 普通城市社区动态 / 一般性入驻报道
2 = 信息模糊 / 时效不确定
1 = 旧文 / 广告

event（活动）：
5 = 全国级OPC峰会 / 官方主办的重大赛事
4 = 省市级OPC主题活动 / 知名机构主办
3 = 一般性沙龙/路演/论坛
2 = 与OPC弱相关的泛创业活动
1 = 旧文 / 广告

case（实战案例）：
5 = 有具体数字（收入/用户量/融资额）的一人公司成功案例
4 = 有具名创业者、有具体项目的深度报道
3 = 有价值的OPC痛点分析 / 行业洞察深度内容
2 = 泛泛而谈、无具体案例的软文
1 = 旧文 / 广告

opinion（观点）：
5 = 行业顶级人物对OPC的重要判断（含具体数据/预测）
4 = 有影响力的人士/媒体对OPC趋势的有洞见观点（有名有姓有具体论点）
3 = 媒体对OPC的客观讨论（有信息密度，非标题党）
2 = 大公司内部公告蹭OPC / 泛AI工具评测 / 标题党 / 重复主题第N篇
1 = 旧文 / 广告 / 极弱相关

时效性修正（在上述分级基础上叠加）：
- 发布日期明确在近7天内：importance 按正常标准，不调整
- 发布日期不确定 / 无法从内容推断：importance 降1档（最低1）
- 发布日期明确超过30天：importance 强制 ≤ 2，或 relevant=false
注意：时效性修正在分类分级之后叠加，最终 importance 不超过5、不低于1

is_recent：内容明确是2025年底至今 → true；2024年及以前或时效不确定 → false（保守）

estimated_date：
- RSS 已提供发布日期 → 直接用
- 从标题/摘要推断（"本月"→当前年月，具体日期直接用）
- 无法判断 → null

重复转载降权规则：
- 若某条内容是对同一事件的二次转载（相同省份+相同政策措施），importance 最高为3
- 判断标准：标题含相同「省份名 + 政策关键词组合」，且内容没有新增信息
- 第一手报道不受此规则限制，按正常标准打分

relevant=false 时其他字段可省略。`
}

// ─── 核心判断函数 ──────────────────────────────────────────────────────────

/**
 * 调用 AI 判断单条内容的相关性和分类
 * 失败时返回 { relevant: false, fallback: true } 降级结果（不入候选池）
 */
export async function judgeItem(
  client: OpenAI,
  input: JudgeInput
): Promise<AIResult & { fallback?: boolean }> {
  try {
    const comp = await Promise.race([
      client.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: buildPrompt(input) }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('AI timeout')), AI_TIMEOUT_MS)
      ),
    ])
    const text = (comp as any).choices[0]?.message?.content ?? ''
    const jm = text.match(/\{[\s\S]*\}/)
    if (!jm) throw new Error('AI 返回无法解析 JSON')

    const r = JSON.parse(jm[0]) as AIResult

    // 应用 importance bonus（RSS guaranteed 源）
    if (r.relevant && r.importance !== undefined && input.baseImportanceBonus) {
      r.importance = Math.max(1, Math.min(5, r.importance + input.baseImportanceBonus))
    }

    return r
  } catch {
    // AI 失败：降级，标记 fallback
    return { relevant: false, importance: 1, summary: null, fallback: true }  // AI 超时降级：不入候选池
  }
}

// ─── 批量判断（2条/批，并发）────────────────────────────────────────────────

function buildBatchPrompt(items: JudgeInput[]): string {
  const itemsText = items.map((it, i) => `
[条目${i + 1}]
标题：${it.title}
摘要：${it.content.slice(0, 500)}
来源：${it.url}
发布日期：${it.publishedAt ?? '未知'}`).join('\n')

  return `你是 OPC 行业信号分析师，负责筛选与「OPC（一人公司）/超级个体/独立创业」相关的内容信号。

以下是 ${items.length} 条待判断的内容。**必须对每条独立分析，不能合并，每条都要有判断理由**。

${itemsText}

判断规则：
- relevant=true：主题与 OPC/一人公司/超级个体/独立创业/OPC社区 有直接关联
- relevant=false：纯商业地产广告、与创业完全无关的科技产品发布、娱乐内容、宏观经济数据（CPI/股市/房产）、与 OPC 无直接关联的大公司新闻
- 重要：如果内容只是「泛创业」或「泛科技」，与 OPC/一人公司/超级个体没有直接关联，importance 必须 ≤ 2
- 大公司（360/百度/阿里等）内部政策、发布会，即使提到「超级个体」，importance 必须 ≤ 2（不是 OPC 创业者的直接信号）

importance 分级（严格执行）：

policy（政策）：
5=国家级政策/含具体金额的重大补贴 4=省市级政策文件/园区专项扶持（有明确措施）
3=园区级公告/信息密度一般的政策解读 2=泛创业政策（未明确提OPC/一人公司）/信息密度低 1=旧文/广告

community（社区）：
5=一线城市标杆社区开业/大型OPC生态平台落地 4=省会城市/有背景机构的新社区开业或重要动态
3=普通城市社区动态/一般性入驻报道 2=信息模糊/时效不确定 1=旧文/广告

event（活动）：
5=全国级OPC峰会/官方主办重大赛事 4=省市级OPC主题活动/知名机构主办
3=一般性沙龙/路演/论坛 2=与OPC弱相关的泛创业活动 1=旧文/广告

case（实战案例）：
5=有具体数字（收入/用户量/融资额）的一人公司成功案例 4=有具名创业者、有具体项目的深度报道
3=有价值的OPC痛点分析/行业洞察深度内容 2=泛泛而谈无具体案例的软文 1=旧文/广告

opinion（观点）：
5=行业顶级人物对OPC的重要判断（含具体数据/预测）
4=有影响力人士/媒体对OPC趋势的有洞见观点（有名有姓有具体论点）
3=媒体对OPC的客观讨论（有信息密度，非标题党）
2=大公司内部公告蹭OPC/泛AI工具评测/标题党/重复主题第N篇 1=旧文/广告

时效性修正：发布日期不确定→importance降1档；超过30天→importance≤2或relevant=false
重复转载降权：同省份+同政策关键词的二次转载 importance 最高为3

请返回 JSON 数组，**必须包含 ${items.length} 个元素，顺序与输入完全对应，每条都要有独立的 reason 字段说明判断理由**：
[
  {
    "index": 1,
    "reason": "一句话说明为何 relevant=true/false，以及 importance 定级依据",
    "relevant": true或false,
    "summary": "提炼原文最具体的1-2个事实（金额/城市/人物/数字/措施名）；无具体信息填null；禁止空话套语",
    "category": "policy|community|event|case|opinion",
    "city": "城市名或null",
    "importance": 1到5的整数,
    "is_recent": true或false,
    "estimated_date": "YYYY-MM-DD或null"
  }
]

只返回 JSON 数组，不要其他内容。`
}

/**
 * 批量判断：2条/批，批次间并发
 * 返回与输入顺序完全对应的结果数组
 */
export async function judgeItemsBatch(
  client: OpenAI,
  inputs: JudgeInput[],
  batchSize = 2,
  concurrency = 10
): Promise<Array<AIResult & { fallback?: boolean }>> {
  // 拆成批次
  const batches: JudgeInput[][] = []
  for (let i = 0; i < inputs.length; i += batchSize) {
    batches.push(inputs.slice(i, i + batchSize))
  }

  // 并发控制
  const results: Array<AIResult & { fallback?: boolean }> = new Array(inputs.length)
  let batchIdx = 0

  async function worker() {
    while (batchIdx < batches.length) {
      const bi = batchIdx++
      const batch = batches[bi]
      const startIdx = bi * batchSize
      try {
        const comp = await Promise.race([
          client.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: 'user', content: buildBatchPrompt(batch) }],
            temperature: 0.1,
          }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('AI timeout')), AI_TIMEOUT_MS * 2)),
        ])
        const text = (comp as any).choices[0]?.message?.content ?? ''
        const jm = text.match(/\[[\s\S]*\]/)
        if (!jm) throw new Error('无法解析 JSON 数组')
        const arr = JSON.parse(jm[0]) as Array<AIResult & { reason?: string }>
        if (!Array.isArray(arr) || arr.length !== batch.length) {
          throw new Error(`返回数量不对: 期望 ${batch.length}，实际 ${arr?.length}`)
        }
        for (let i = 0; i < batch.length; i++) {
          const r = arr[i]
          // 应用 importance bonus
          if (r.relevant && r.importance !== undefined && batch[i].baseImportanceBonus) {
            r.importance = Math.max(1, Math.min(5, r.importance + batch[i].baseImportanceBonus!))
          }
          results[startIdx + i] = r
        }
      } catch {
        // 降级：批次失败逐条降级
        for (let i = 0; i < batch.length; i++) {
          results[startIdx + i] = { relevant: false, importance: 1, summary: null, fallback: true }  // AI 超时降级：不入候选池
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker))
  return results
}

// ─── 时间过滤 ──────────────────────────────────────────────────────────────

/**
 * 解析发布时间，应用时间窗口过滤
 * 返回 null 表示应该丢弃
 */
export function resolveAndFilterDate(
  publishedAt: Date | null,
  estimatedDate: string | null | undefined
): Date | null {
  let resolved = publishedAt
  if (!resolved && estimatedDate) {
    const d = new Date(estimatedDate)
    resolved = isNaN(d.getTime()) ? null : d
  }

  // 没有任何时间信息：允许入库（靠 importance 控制）
  if (!resolved) return null

  // 超过 MAX_AGE_DAYS 的旧文：丢弃
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000)
  if (resolved < cutoff) return null // 返回 null 表示太旧

  return resolved
}

/**
 * 判断是否太旧应该丢弃（返回 true = 丢弃）
 */
export function isTooOld(publishedAt: Date | null, estimatedDate: string | null | undefined): boolean {
  let resolved = publishedAt
  if (!resolved && estimatedDate) {
    const d = new Date(estimatedDate)
    resolved = isNaN(d.getTime()) ? null : d
  }
  if (!resolved) return false // 无时间信息不丢弃
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000)
  return resolved < cutoff
}
