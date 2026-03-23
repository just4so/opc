/**
 * 社区数据导入脚本
 * 从 Excel 文件导入完整的社区数据
 * 使用 upsert 避免重复，并补全缺失信息
 */

import XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 生成标准化 slug
function generateSlug(city: string, name: string): string {
  return `${city}-${name}`
    .toLowerCase()
    .replace(/[（）()·\s·]/g, '')
    .replace(/opc社区$/i, 'opc')
    .replace(/社区$/i, '')
    .replace(/生态$/, '')
}

// 解析城市和区
function parseLocation(location: string): { city: string; district?: string } {
  if (!location) return { city: '' }

  // 移除省份前缀
  let cleaned = location
    .replace(/^(四川省|安徽省|江苏省|浙江省|广东省|福建省|湖北省|山东省|河北省|新疆维吾尔自治区|广西壮族自治区)/, '')
    .trim()

  // 提取城市和区
  const match = cleaned.match(/^(.+?市)(.+?[区县])?/)
  if (match) {
    const city = match[1].replace(/市$/, '')
    const district = match[2]
    return { city, district }
  }

  // 简单格式
  return { city: cleaned.replace(/市$/, '') }
}

// 解析服务列表
function parseServices(text: string): string[] {
  if (!text || text === '-') return []
  return text
    .split(/[；;、，,]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== '-')
}

// 解析适合人群
function parseSuitableFor(text: string): string[] {
  if (!text || text === '-') return []
  return text
    .split(/[；;、，,]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== '-')
}

// 解析链接
function parseLinks(text: string): { title: string; url: string }[] {
  if (!text || text === '-') return []
  const links: { title: string; url: string }[] = []

  // 匹配 【标题】(url) 格式
  const regex = /【([^】]+)】\(([^)]+)\)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    links.push({ title: match[1], url: match[2] })
  }

  // 如果没有匹配到，尝试直接提取 URL
  if (links.length === 0 && text.includes('http')) {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/)
    if (urlMatch) {
      links.push({ title: '参考链接', url: urlMatch[1] })
    }
  }

  return links
}

interface ExcelRow {
  '社区名称': string
  '所在城市': string
  '详细地址': string
  '运营方': string
  '揭牌时间': string
  '社区简介': string
  '空间补贴政策': string
  '算力补贴政策': string
  '入驻流程描述': string
  '配套服务列表': string
  '适合人群列表': string
  '参考链接': string
  '官方联系方式': string
  '社区图片url': string
}

async function main() {
  console.log('📥 开始从 Excel 导入社区数据...\n')

  // 读取 Excel 文件
  const workbook = XLSX.readFile('./信息汇总_国内各城市OPC社区调研.xlsx')
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(sheet) as ExcelRow[]

  console.log(`📊 Excel 中共 ${data.length} 条记录\n`)

  // 去重：按社区名称保留最完整的记录
  const uniqueMap = new Map<string, ExcelRow>()
  data.forEach(row => {
    const name = (row['社区名称'] || '').trim()
    if (!name) return

    const existing = uniqueMap.get(name)
    if (!existing) {
      uniqueMap.set(name, row)
    } else {
      // 保留信息更完整的那条
      const existingScore = Object.values(existing).filter(v => v && v !== '-').length
      const newScore = Object.values(row).filter(v => v && v !== '-').length
      if (newScore > existingScore) {
        uniqueMap.set(name, row)
      }
    }
  })

  console.log(`🔄 去重后 ${uniqueMap.size} 条唯一记录\n`)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const [name, row] of Array.from(uniqueMap.entries())) {
    try {
      const { city, district } = parseLocation(row['所在城市'])

      if (!city) {
        console.log(`⚠️ 跳过（无城市）: ${name}`)
        skipped++
        continue
      }

      const slug = generateSlug(city, name)
      const address = (row['详细地址'] || '').trim()
      const description = (row['社区简介'] || '').trim()

      if (!description) {
        console.log(`⚠️ 跳过（无简介）: ${name}`)
        skipped++
        continue
      }

      // 构建 policies
      const policies: Record<string, string> = {}
      const spacePolicy = (row['空间补贴政策'] || '').trim()
      const computePolicy = (row['算力补贴政策'] || '').trim()
      if (spacePolicy && spacePolicy !== '-') policies.space = spacePolicy
      if (computePolicy && computePolicy !== '-') policies.compute = computePolicy

      // 构建入驻流程
      const entryProcess = row['入驻流程描述']
        ? parseServices(row['入驻流程描述'])
        : []

      // 构建服务列表
      const services = parseServices(row['配套服务列表'])

      // 构建适合人群
      const suitableFor = parseSuitableFor(row['适合人群列表'])

      // 构建链接
      const links = parseLinks(row['参考链接'])

      // 联系方式
      const contactPhone = (row['官方联系方式'] || '').trim()

      // 图片
      const coverImage = (row['社区图片url'] || '').trim()

      // Upsert 数据
      const result = await prisma.community.upsert({
        where: { slug },
        update: {
          name,
          city,
          district: district || null,
          address: address || '',
          description,
          operator: (row['运营方'] || '').trim() || null,
          policies: Object.keys(policies).length > 0 ? policies : undefined,
          entryProcess,
          services,
          suitableFor,
          links: links.length > 0 ? links : undefined,
          contactPhone: contactPhone && contactPhone !== '-' ? contactPhone : null,
          coverImage: coverImage && coverImage !== '-' ? coverImage : null,
        },
        create: {
          slug,
          name,
          city,
          district: district || null,
          address: address || '',
          description,
          operator: (row['运营方'] || '').trim() || null,
          policies: Object.keys(policies).length > 0 ? policies : undefined,
          entryProcess,
          services,
          suitableFor,
          links: links.length > 0 ? links : undefined,
          contactPhone: contactPhone && contactPhone !== '-' ? contactPhone : null,
          coverImage: coverImage && coverImage !== '-' ? coverImage : null,
          status: 'ACTIVE',
        },
      })

      const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
      if (isNew) {
        console.log(`✅ 新增: ${name} (${city})`)
        created++
      } else {
        console.log(`🔄 更新: ${name} (${city})`)
        updated++
      }
    } catch (error) {
      console.error(`❌ 失败: ${name}`, error)
      skipped++
    }
  }

  // 统计结果
  console.log('\n📊 导入完成:')
  console.log(`   新增: ${created} 个社区`)
  console.log(`   更新: ${updated} 个社区`)
  console.log(`   跳过: ${skipped} 个`)
  console.log(`   总计: ${uniqueMap.size} 条数据`)

  // 最终统计
  const finalCount = await prisma.community.count()
  console.log(`\n🎉 数据库当前共 ${finalCount} 个社区`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
