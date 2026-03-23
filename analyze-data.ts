import XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

async function main() {
  const workbook = XLSX.readFile('/Users/wl/Documents/GitHub/opc/信息汇总_国内各城市OPC社区调研.xlsx')
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const excelData = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[]

  // 分析 Excel 重复
  const seen = new Map<string, number[]>()
  excelData.forEach((row, idx) => {
    const name = (row['社区名称'] || '').trim()
    const city = (row['所在城市'] || '').trim()
    const key = name + '|' + city
    if (!seen.has(key)) {
      seen.set(key, [idx + 2])
    } else {
      seen.get(key)!.push(idx + 2)
    }
  })

  console.log('=== Excel 中重复的社区 ===')
  let dupCount = 0
  seen.forEach((rows, key) => {
    if (rows.length > 1) {
      dupCount++
      console.log(key + ' (行 ' + rows.join(', ') + ')')
    }
  })
  console.log('\n共 ' + dupCount + ' 组重复\n')

  // 获取 Excel 唯一社区名称
  const excelNames = new Set<string>()
  excelData.forEach(row => {
    const name = (row['社区名称'] || '').trim()
    if (name) excelNames.add(name)
  })
  console.log('Excel 唯一社区: ' + excelNames.size + ' 个')

  // 获取数据库社区
  const prisma = new PrismaClient()
  const dbCommunities = await prisma.community.findMany({
    select: { name: true, city: true, slug: true }
  })
  const dbNames = new Set(dbCommunities.map(c => c.name))
  console.log('数据库社区: ' + dbNames.size + ' 个\n')

  // 找出 Excel 有但数据库没有的
  console.log('=== Excel 有但网站缺失的社区 ===')
  const missing: string[] = []
  excelNames.forEach(name => {
    if (!dbNames.has(name)) {
      missing.push(name)
    }
  })
  missing.sort().forEach(name => console.log('- ' + name))
  console.log('\n共 ' + missing.length + ' 个缺失')

  // 找出数据库有但 Excel 没有的
  console.log('\n=== 网站有但 Excel 没有的社区 ===')
  const extra: string[] = []
  dbNames.forEach(name => {
    if (!excelNames.has(name)) {
      extra.push(name)
    }
  })
  extra.sort().forEach(name => console.log('- ' + name))
  console.log('\n共 ' + extra.length + ' 个额外')

  await prisma.$disconnect()
}

main().catch(console.error)
