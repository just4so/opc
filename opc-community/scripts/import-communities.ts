/**
 * 社区数据导入脚本
 * 从Markdown文件解析并导入社区数据到数据库
 *
 * 使用方法：npm run import:communities
 */

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 城市目录列表
const CITY_DIRS = [
  '深圳', '杭州', '常州', '苏州', '无锡', '昆山',
  '北京', '上海', '广州', '成都', '武汉', '南京',
  '青岛', '宁波', '厦门', '福州'
]

// 数据源目录（相对于项目根目录的上级）
const DATA_SOURCE_DIR = path.join(__dirname, '../../')

interface ParsedCommunity {
  name: string
  city: string
  district?: string
  address: string
  operator?: string
  contactName?: string
  description: string
  policies: Record<string, any>
  entryProcess: string[]
  services: string[]
  suitableFor: string[]
  notes: string[]
  links: Array<{ title: string; url: string }>
  spaceSize?: string
  workstations?: number
}

/**
 * 解析Markdown表格
 */
function parseMarkdownTable(content: string, sectionName: string): Record<string, string> {
  const result: Record<string, string> = {}

  // 匹配指定section的内容
  const sectionRegex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=\\n## |$)`, 'g')
  const match = content.match(sectionRegex)

  if (match) {
    const tableRegex = /\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g
    let tableMatch
    while ((tableMatch = tableRegex.exec(match[0])) !== null) {
      const key = tableMatch[1].trim()
      const value = tableMatch[2].trim()
      // 跳过表头分隔行
      if (!key.includes('---') && !key.includes('项目') && !key.includes('优惠')) {
        result[key] = value.replace(/\*\*/g, '') // 移除加粗标记
      }
    }
  }
  return result
}

/**
 * 解析列表项
 */
function parseList(content: string, sectionName: string): string[] {
  const sectionRegex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=\\n## |$)`, 'g')
  const match = content.match(sectionRegex)

  if (match) {
    const items: string[] = []
    // 匹配数字列表和破折号列表
    const listRegex = /^[\d]+\.\s+(.+)$|^[-*]\s+(.+)$/gm
    let listMatch
    while ((listMatch = listRegex.exec(match[0])) !== null) {
      const item = (listMatch[1] || listMatch[2])?.trim()
      if (item && !item.startsWith('**')) {
        items.push(item.replace(/\*\*/g, ''))
      }
    }
    return items
  }
  return []
}

/**
 * 解析入驻政策
 */
function parsePolicies(content: string): Record<string, any> {
  const policies: Record<string, any> = {}

  // 解析空间补贴
  const spaceMatch = content.match(/### 空间补贴[\s\S]*?(?=\n### |\n## |$)/)
  if (spaceMatch) {
    const table = parseMarkdownTable(spaceMatch[0], '')
    if (Object.keys(table).length > 0) {
      policies.spaceSubsidy = table
    }
  }

  // 解析算力补贴
  const computeMatch = content.match(/### 算力补贴[\s\S]*?(?=\n### |\n## |$)/)
  if (computeMatch) {
    const items: string[] = []
    const listRegex = /^[-*]\s+(.+)$/gm
    let match
    while ((match = listRegex.exec(computeMatch[0])) !== null) {
      items.push(match[1].replace(/\*\*/g, ''))
    }
    if (items.length > 0) {
      policies.computeSubsidy = items
    }
  }

  // 解析核心福利
  const benefitsMatch = content.match(/### 核心福利[\s\S]*?(?=\n### |\n## |$)/)
  if (benefitsMatch) {
    const table = parseMarkdownTable(benefitsMatch[0], '')
    if (Object.keys(table).length > 0) {
      policies.coreBenefits = table
    }
  }

  // 解析政策券支持
  const voucherMatch = content.match(/### 政策券支持[\s\S]*?(?=\n### |\n## |$)/)
  if (voucherMatch) {
    const table = parseMarkdownTable(voucherMatch[0], '')
    if (Object.keys(table).length > 0) {
      policies.vouchers = table
    }
  }

  // 解析综合政策
  const comprehensiveMatch = content.match(/### 综合政策[\s\S]*?(?=\n### |\n## |$)/)
  if (comprehensiveMatch) {
    const items: string[] = []
    const listRegex = /^[-*]\s+(.+)$/gm
    let match
    while ((match = listRegex.exec(comprehensiveMatch[0])) !== null) {
      items.push(match[1].replace(/\*\*/g, ''))
    }
    if (items.length > 0) {
      policies.comprehensive = items
    }
  }

  // 解析配套政策
  const supportMatch = content.match(/### 配套政策[\s\S]*?(?=\n### |\n## |$)/)
  if (supportMatch) {
    const items: string[] = []
    const listRegex = /^[-*]\s+(.+)$/gm
    let match
    while ((match = listRegex.exec(supportMatch[0])) !== null) {
      items.push(match[1].replace(/\*\*/g, ''))
    }
    if (items.length > 0) {
      policies.support = items
    }
  }

  return policies
}

/**
 * 解析参考链接
 */
function parseLinks(content: string): Array<{ title: string; url: string }> {
  const linksSection = content.match(/## 参考链接[\s\S]*?(?=\n## |$)/)
  if (!linksSection) return []

  const links: Array<{ title: string; url: string }> = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = linkRegex.exec(linksSection[0])) !== null) {
    links.push({ title: match[1], url: match[2] })
  }
  return links
}

/**
 * 从城市字段提取区
 */
function extractDistrict(cityField?: string): string | undefined {
  if (!cityField) return undefined
  const match = cityField.match(/(.+市)?(.+区)/)
  return match ? match[2] : undefined
}

/**
 * 生成URL友好的slug
 */
function generateSlug(name: string, city: string): string {
  // 使用城市-名称组合，去除特殊字符
  const combined = `${city}-${name}`
  return combined
    .toLowerCase()
    .replace(/[（）()]/g, '')
    .replace(/\s+/g, '-')
}

/**
 * 解析单个社区Markdown文件
 */
function parseCommunityMd(filePath: string, city: string): ParsedCommunity {
  const content = fs.readFileSync(filePath, 'utf-8')

  // 提取标题（社区名称）
  const titleMatch = content.match(/^# (.+)/m)
  let name = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md')
  // 去除名称中的区域后缀
  name = name.replace(/（.+）$/, '').trim()

  // 解析基本信息表格
  const basicInfo = parseMarkdownTable(content, '基本信息')

  // 解析社区简介
  const descMatch = content.match(/## 社区简介\n\n([\s\S]*?)(?=\n## )/)
  const description = descMatch ? descMatch[1].trim() : ''

  // 解析入驻流程
  const entryProcess = parseList(content, '入驻流程')

  // 解析配套服务
  const services = parseList(content, '配套服务')

  // 解析适合人群
  const suitableFor = parseList(content, '适合人群')

  // 解析注意事项
  const notes = parseList(content, '注意事项')

  // 解析入驻政策
  const policies = parsePolicies(content)

  // 解析参考链接
  const links = parseLinks(content)

  // 提取空间信息
  let spaceSize: string | undefined
  let workstations: number | undefined

  if (basicInfo['空间面积']) {
    const sizeMatch = basicInfo['空间面积'].match(/(\d+)/)
    spaceSize = basicInfo['空间面积']
    if (sizeMatch) {
      const wsMatch = basicInfo['空间面积'].match(/(\d+)个工位/)
      if (wsMatch) {
        workstations = parseInt(wsMatch[1])
      }
    }
  }

  return {
    name,
    city,
    district: basicInfo['所在区域'] || extractDistrict(basicInfo['所在城市']),
    address: basicInfo['详细地址'] || '',
    operator: basicInfo['运营主体'] || basicInfo['运营方'],
    contactName: basicInfo['联系人'] || basicInfo['创始人'],
    description,
    policies,
    entryProcess,
    services,
    suitableFor,
    notes,
    links,
    spaceSize,
    workstations,
  }
}

/**
 * 主导入函数
 */
async function importCommunities() {
  console.log('开始导入社区数据...\n')

  let totalImported = 0
  let totalFailed = 0

  for (const cityDir of CITY_DIRS) {
    const cityPath = path.join(DATA_SOURCE_DIR, cityDir)

    if (!fs.existsSync(cityPath)) {
      console.log(`跳过不存在的目录: ${cityDir}`)
      continue
    }

    const files = fs.readdirSync(cityPath).filter(f => f.endsWith('.md'))
    console.log(`处理城市: ${cityDir} (${files.length} 个文件)`)

    for (const file of files) {
      const filePath = path.join(cityPath, file)

      try {
        const data = parseCommunityMd(filePath, cityDir)
        const slug = generateSlug(data.name, data.city)

        await prisma.community.upsert({
          where: { slug },
          update: {
            name: data.name,
            city: data.city,
            district: data.district,
            address: data.address,
            operator: data.operator,
            contactName: data.contactName,
            description: data.description,
            policies: data.policies,
            entryProcess: data.entryProcess,
            services: data.services,
            suitableFor: data.suitableFor,
            notes: data.notes,
            links: data.links,
            spaceSize: data.spaceSize,
            workstations: data.workstations,
            updatedAt: new Date(),
          },
          create: {
            slug,
            name: data.name,
            city: data.city,
            district: data.district,
            address: data.address,
            operator: data.operator,
            contactName: data.contactName,
            description: data.description,
            type: 'OFFLINE',
            focus: ['AI'],
            policies: data.policies,
            entryProcess: data.entryProcess,
            services: data.services,
            suitableFor: data.suitableFor,
            notes: data.notes,
            links: data.links,
            spaceSize: data.spaceSize,
            workstations: data.workstations,
          },
        })

        console.log(`  ✓ ${data.name}`)
        totalImported++
      } catch (error) {
        console.error(`  ✗ ${file}:`, error)
        totalFailed++
      }
    }
  }

  console.log(`\n导入完成！成功: ${totalImported}, 失败: ${totalFailed}`)
}

// 运行导入
importCommunities()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
