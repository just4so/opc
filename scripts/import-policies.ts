import * as fs from 'fs'
import * as path from 'path'
import prisma from '../lib/db'

// 直辖市列表（省市同名）
const MUNICIPALITIES = new Set(['北京', '上海', '天津', '重庆'])

// 去掉省份/城市后缀
function normalizeProvince(raw: string): string {
  return raw
    .replace(/市$/, '')
    .replace(/省$/, '')
    .replace(/自治区$/, '')
    .replace(/壮族自治区$/, '')
    .replace(/维吾尔自治区$/, '')
    .trim()
}

function normalizeCity(raw: string): string {
  return raw
    .replace(/市$/, '')
    .trim()
}

// 解析地区字段，返回 { city, district }
function parseDistrict(
  rawDistrict: string,
  province: string
): { city: string | null; district: string | null } {
  const d = rawDistrict.trim()

  // 省级
  if (d === '省级' || d === '市级' && MUNICIPALITIES.has(province)) {
    return { city: null, district: null }
  }

  // 纯市级标记
  if (d === '市级') {
    return { city: province, district: null }
  }

  // 含区/县/开发区/高新区/新片区/园区/科学城 → district
  const districtPattern = /区$|县$|开发区$|高新区$|新片区$|园区$|科学城$|新区$|经开区$|工业园$|产业园$/
  if (districtPattern.test(d)) {
    // 直辖市：city = province
    if (MUNICIPALITIES.has(province)) {
      return { city: province, district: d }
    }
    // 非直辖市：district 可能包含城市前缀，如"南京栖霞高新区"
    // 尝试从 district 中提取城市名
    // 常见格式：城市名+区名，如"南京栖霞高新区"、"苏州工业园区"
    // 这里直接用 province 作为 city（因为 district 已经包含了区名）
    return { city: province, district: d }
  }

  // 含「市」且非直辖市 → 修正 city
  if (d.includes('市') && !MUNICIPALITIES.has(province)) {
    const cityName = normalizeCity(d)
    return { city: cityName, district: null }
  }

  // 其他情况（如"滨海高新区"等已经是区名格式）
  if (MUNICIPALITIES.has(province)) {
    return { city: province, district: d }
  }

  // 默认：当作城市处理
  return { city: normalizeCity(d), district: null }
}

// 解析状态
function parseStatus(statusRaw: string): 'ACTIVE' | 'DRAFT' | 'EXPIRED' {
  if (statusRaw.includes('征求意见')) return 'DRAFT'
  return 'ACTIVE'
}

interface PolicyRow {
  seq: number
  province: string
  district: string
  title: string
  status: string
  relevance: string
  fullTextStatus: string
  summary: string
}

function parseTable(content: string): PolicyRow[] {
  const lines = content.split('\n')
  const rows: PolicyRow[] = []

  let inTable = false
  for (const line of lines) {
    const trimmed = line.trim()

    // 找到表头行
    if (trimmed.startsWith('| 序号 |')) {
      inTable = true
      continue
    }

    // 跳过分隔行
    if (inTable && trimmed.startsWith('|---')) {
      continue
    }

    // 结束表格
    if (inTable && !trimmed.startsWith('|')) {
      break
    }

    if (inTable && trimmed.startsWith('|')) {
      // 解析列：| 序号 | 省份 | 地区 | 政策名称 | 状态 | 相关度 | 全文状态 | 核心扶持 |
      const cols = trimmed.split('|').map((c) => c.trim()).filter((_, i) => i > 0)
      if (cols.length < 8) continue

      const seq = parseInt(cols[0])
      if (isNaN(seq)) continue

      rows.push({
        seq,
        province: cols[1],
        district: cols[2],
        title: cols[3],
        status: cols[4],
        relevance: cols[5],
        fullTextStatus: cols[6],
        summary: cols[7],
      })
    }
  }

  return rows
}

async function main() {
  const mdPath = '/Users/wei/Desktop/全国OPC专项政策全文汇编.md'
  const content = fs.readFileSync(mdPath, 'utf-8')

  const rows = parseTable(content)
  console.log(`解析到 ${rows.length} 条记录`)

  // 过滤相关度为「弱」的条目
  const filtered = rows.filter((r) => r.relevance !== '弱')
  console.log(`过滤后 ${filtered.length} 条（跳过相关度为「弱」的条目）`)

  // 清空旧数据（幂等）
  await prisma.policy.deleteMany()
  console.log('已清空旧数据')

  let imported = 0
  let skipped = 0

  for (const row of filtered) {
    const province = normalizeProvince(row.province)
    const { city, district } = parseDistrict(row.district, province)

    // 直辖市：city = province
    const finalCity = MUNICIPALITIES.has(province) && city === null && row.district !== '省级'
      ? province
      : city

    const status = parseStatus(row.status)

    try {
      await prisma.policy.create({
        data: {
          province,
          city: finalCity,
          district,
          title: row.title,
          summary: row.summary,
          status,
        },
      })
      imported++
    } catch (err) {
      console.error(`导入失败 [${row.seq}] ${row.title}:`, err)
      skipped++
    }
  }

  console.log(`\n导入完成：${imported} 条成功，${skipped} 条失败`)

  // 统计
  const total = await prisma.policy.count()
  const cities = await prisma.policy.groupBy({
    by: ['city'],
    where: { city: { not: null } },
  })
  console.log(`数据库中共 ${total} 条政策，覆盖 ${cities.length} 个城市`)

  // 验证：检查是否有带「市」后缀的 city
  const badCities = await prisma.policy.findMany({
    where: { city: { endsWith: '市' } },
    select: { city: true, title: true },
  })
  if (badCities.length > 0) {
    console.warn(`⚠️  发现 ${badCities.length} 条 city 字段带「市」后缀：`)
    badCities.forEach((p) => console.warn(`  - ${p.city}: ${p.title}`))
  } else {
    console.log('✅ city 字段无「市」后缀')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
