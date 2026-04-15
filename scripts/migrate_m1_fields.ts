/**
 * migrate_m1_fields.ts
 * 第一阶段机械迁移：旧字段 → 新字段（无 LLM，无损转换）
 *
 * 迁移规则：
 * 1. focusTracks  ← focus（直接复制，仅当 focusTracks 为空时）
 * 2. totalWorkstations ← workstations（Int，仅当 totalWorkstations 为 null 时）
 * 3. totalArea    ← spaceSize（String，仅当 totalArea 为 null 时）
 * 4. entryInfo    ← entryProcess（包成 { steps: [...] }，仅当 entryInfo 为 null 时）
 * 5. benefits     ← policies（归一化为标准 5 分类结构，仅当 benefits 为 null 时）
 *
 * policies → benefits 转换逻辑：
 *   - Array<string>       → benefits.office.items
 *   - Object (含 policy_name / price_range / policy_interpretation / support_directions)
 *                         → 提取字段分发到对应分类
 *   - string              → benefits.office.summary
 *   - null                → 跳过
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------- 类型定义 ----------

interface BenefitSection {
  summary?: string
  items?: string[]
}

interface Benefits {
  office?: BenefitSection
  compute?: BenefitSection
  business?: BenefitSection
  funding?: BenefitSection
  housing?: BenefitSection
}

interface EntryInfo {
  requirements?: string[]
  steps?: string[]
  duration?: string
}

// ---------- policies → benefits 转换 ----------

function normalizePolicies(policies: unknown): Benefits | null {
  if (policies === null || policies === undefined) return null

  const b: Benefits = {}

  // 数组型：字符串列表
  if (Array.isArray(policies)) {
    const items = policies.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    if (items.length > 0) {
      b.office = { items }
    }
    return Object.keys(b).length > 0 ? b : null
  }

  // 对象型
  if (typeof policies === 'object') {
    const obj = policies as Record<string, unknown>

    // office: price_range / policy_name 描述性信息
    const officeParts: string[] = []
    if (typeof obj.policy_name === 'string' && obj.policy_name.trim()) {
      officeParts.push(obj.policy_name.trim())
    }
    if (typeof obj.price_range === 'string' && obj.price_range.trim()) {
      officeParts.push(`费用：${obj.price_range.trim()}`)
    }
    if (officeParts.length > 0) {
      b.office = { summary: officeParts.join('；') }
    }

    // business / funding: support_directions
    if (typeof obj.support_directions === 'string' && obj.support_directions.trim()) {
      const dirs = obj.support_directions
        .split(/[、，,；;]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
      // 判断是否含融资关键词
      const fundingKws = ['融资', '贷款', '基金', '奖励', '补贴资金', '启动资金', '创业资金']
      const bizKws = ['政务', '订单', '市场', '场景', '数字化']
      const fundingItems = dirs.filter(d => fundingKws.some(k => d.includes(k)))
      const bizItems = dirs.filter(d => bizKws.some(k => d.includes(k)))
      const rest = dirs.filter(d => !fundingItems.includes(d) && !bizItems.includes(d))

      if (fundingItems.length > 0) b.funding = { items: fundingItems }
      if (bizItems.length > 0) b.business = { items: bizItems }
      if (rest.length > 0) {
        b.office = { ...(b.office ?? {}), items: [...(b.office?.items ?? []), ...rest] }
      }
    }

    // 长文本 policy_interpretation → office.items（按换行拆分）
    if (typeof obj.policy_interpretation === 'string' && obj.policy_interpretation.trim()) {
      const lines = obj.policy_interpretation
        .split(/\n+/)
        .map((s: string) => s.replace(/^[-*•·]\s*/, '').trim())
        .filter((s: string) => s.length > 5)
      if (lines.length > 0) {
        b.office = {
          ...(b.office ?? {}),
          items: [...(b.office?.items ?? []), ...lines.slice(0, 10)],
        }
      }
    }

    // 数字索引键（旧式数组对象如 {"0":"xxx","1":"yyy"}）
    const numericEntries = Object.entries(obj)
      .filter(([k]) => /^\d+$/.test(k))
      .map(([, v]) => v)
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    if (numericEntries.length > 0) {
      b.office = {
        ...(b.office ?? {}),
        items: [...(b.office?.items ?? []), ...numericEntries],
      }
    }

    return Object.keys(b).length > 0 ? b : null
  }

  // 字符串型
  if (typeof policies === 'string' && policies.trim()) {
    b.office = { summary: policies.trim() }
    return b
  }

  return null
}

// ---------- 主逻辑 ----------

async function main() {
  const communities = await prisma.community.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      focus: true,
      workstations: true,
      spaceSize: true,
      entryProcess: true,
      policies: true,
      focusTracks: true,
      totalWorkstations: true,
      totalArea: true,
      entryInfo: true,
      benefits: true,
    },
  })

  console.log(`共 ${communities.length} 条社区记录，开始迁移...\n`)

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const c of communities) {
    const patch: Record<string, unknown> = {}

    // 1. focusTracks ← focus
    if (c.focusTracks.length === 0 && c.focus.length > 0) {
      patch.focusTracks = c.focus
    }

    // 2. totalWorkstations ← workstations
    if (c.totalWorkstations === null && c.workstations !== null) {
      patch.totalWorkstations = c.workstations
    }

    // 3. totalArea ← spaceSize
    if (c.totalArea === null && c.spaceSize && c.spaceSize.trim()) {
      patch.totalArea = c.spaceSize.trim()
    }

    // 4. entryInfo ← entryProcess
    if (c.entryInfo === null && c.entryProcess.length > 0) {
      const ei: EntryInfo = {
        steps: c.entryProcess.filter(s => s.trim().length > 0),
      }
      patch.entryInfo = ei
    }

    // 5. benefits ← policies
    if (c.benefits === null && c.policies !== null) {
      const b = normalizePolicies(c.policies)
      if (b) patch.benefits = b
    }

    if (Object.keys(patch).length === 0) {
      skipped++
      continue
    }

    try {
      await prisma.community.update({ where: { id: c.id }, data: patch })
      updated++
      const fields = Object.keys(patch).join(', ')
      console.log(`✅ [${c.city}] ${c.name}  →  ${fields}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`❌ ${c.name}: ${msg}`)
      console.error(`❌ [${c.city}] ${c.name}: ${msg}`)
    }
  }

  console.log(`\n========== 迁移完成 ==========`)
  console.log(`更新: ${updated} 条`)
  console.log(`跳过: ${skipped} 条（新字段已有值）`)
  if (errors.length > 0) {
    console.log(`错误: ${errors.length} 条`)
    errors.forEach(e => console.log(e))
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
