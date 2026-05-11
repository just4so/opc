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
  event_key?: string | null
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

const AI_MODEL = 'deepseek-chat'
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

请返回 JSON（不要其他内容）：
{
  "relevant": true或false,
  "summary": "50-100字中文摘要，含关键数字和事实，无内容可填时为null",
  "category": "policy（政策动向）|community（社区动态）|event（活动赛事）|case（实战案例）|opinion（新锐观点）",
  "city": "城市名或null（全国性内容填null）",
  "importance": 1到5的整数,
  "event_key": "同一事件多篇报道时填相同key（5-10字），否则填null",
  "is_recent": true或false,
  "estimated_date": "YYYY-MM-DD格式的推断发布日期，或null"
}

importance 分级：
5 = 国家级政策 / 一线城市顶级社区开业 / 大额补贴（含具体金额）
4 = 省市级政策 / 新社区开业 / 知名活动 / 有数据支撑的案例
3 = 普通近期动态 / 一般活动 / 有价值的分析观点
2 = 时效不确定 / 弱相关 / 信息密度低
1 = 旧文（明确2024年前） / 纯广告 / 极弱相关

is_recent：内容明确是2025年底至今 → true；2024年及以前或时效不确定 → false（保守）

estimated_date：
- RSS 已提供发布日期 → 直接用
- 从标题/摘要推断（"本月"→当前年月，具体日期直接用）
- 无法判断 → null

event_key：同一政策/事件的多篇报道填相同 key（5-10字），通用信息填 null

relevant=false 时其他字段可省略。`
}

// ─── 核心判断函数 ──────────────────────────────────────────────────────────

/**
 * 调用 AI 判断单条内容的相关性和分类
 * 失败时返回 { relevant: true, fallback: true } 降级结果
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
    return { relevant: true, importance: 2, summary: null, fallback: true }
  }
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
