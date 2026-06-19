/**
 * Week 2 Seed 脚本
 * 1. 写入 5 篇原创资讯
 * 2. 写入合作广场 20 条种子数据
 * 3. 补 User.mainTrack / startupStage 字段
 */
import { PrismaClient } from '@prisma/client'
import newsData from '../tasks/news-original-fixed.json'
import { MARKET_ITEMS } from '../tasks/market-seed'

const prisma = new PrismaClient()

// ==============================
// 用户赛道字段（补全 mainTrack / startupStage）
// ==============================
const USER_TRACKS: Record<string, { mainTrack: string; startupStage: string }> = {
  sucity_walker:    { mainTrack: '内容创作', startupStage: '已有收入' },
  wuhan_ahui:       { mainTrack: '内容创作', startupStage: '摸索期' },
  hangzhou_mumu:    { mainTrack: '知识付费', startupStage: '已有收入' },
  beijing_xiaoyu:   { mainTrack: 'AI工具开发', startupStage: '已有收入' },
  shenzhen_global:  { mainTrack: '跨境电商', startupStage: '稳定盈利' },
  chengdu_slow:     { mainTrack: '专业服务', startupStage: '摸索期' },
  shenyang_tech:    { mainTrack: 'AI工具开发', startupStage: '摸索期' },
  nanjing_laoxu:    { mainTrack: '专业服务', startupStage: '稳定盈利' },
  shanghai_karen:   { mainTrack: '跨境电商', startupStage: '已有收入' },
  xiamen_xiaolin:   { mainTrack: '内容创作', startupStage: '摸索期' },
  guangzhou_outbound: { mainTrack: '跨境电商', startupStage: '已有收入' },
  shanghai_aigc:    { mainTrack: 'AI工具开发', startupStage: '已有收入' },
  beijing_indie_dev: { mainTrack: 'AI工具开发', startupStage: '摸索期' },
  shanghai_legalai: { mainTrack: '专业服务', startupStage: '已有收入' },
  shenzhen_hardware: { mainTrack: 'AI工具开发', startupStage: '摸索期' },
  xiamen_nomad:     { mainTrack: '内容创作', startupStage: '摸索期' },
  wuhan_student:    { mainTrack: '知识付费', startupStage: '摸索期' },
  beijing_aiedu:    { mainTrack: '知识付费', startupStage: '已有收入' },
  suzhou_o2o:       { mainTrack: '专业服务', startupStage: '已有收入' },
  shanghai_pr:      { mainTrack: '内容创作', startupStage: '稳定盈利' },
}

async function main() {
  console.log('🚀 Week 2 Seed 开始\n')

  // ── 1. 原创资讯入库 ──
  console.log('📰 写入原创资讯...')
  let newsCount = 0
  for (const item of newsData as any[]) {
    const existing = await prisma.news.findFirst({
      where: { title: item.title },
      select: { id: true },
    })
    if (existing) {
      console.log(`  跳过（已存在）: ${item.title.slice(0, 30)}`)
      continue
    }
    await prisma.news.create({
      data: {
        title: item.title,
        summary: item.summary,
        content: item.content,
        source: item.source,
        category: item.category,
        isOriginal: item.isOriginal ?? true,
        author: item.author ?? 'OPC创业圈编辑部',
        publishedAt: new Date(item.publishedAt),
        url: `/news/original-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,  // 原创内容用内部路径
      },
    })
    newsCount++
    console.log(`  ✅ ${item.title.slice(0, 40)}`)
  }
  console.log(`  合计新增: ${newsCount} 篇\n`)

  // ── 2. 合作广场种子数据 ──
  console.log('🤝 写入合作广场数据...')
  let marketCount = 0

  // 先建立 username -> userId 映射
  const userMap = new Map<string, string>()
  const users = await prisma.user.findMany({ select: { id: true, username: true } })
  for (const u of users) userMap.set(u.username, u.id)

  for (const item of MARKET_ITEMS) {
    const ownerId = userMap.get(item.ownerUsername)
    if (!ownerId) {
      console.log(`  ⚠️  用户不存在跳过: ${item.ownerUsername}`)
      continue
    }
    const existing = await prisma.project.findFirst({
      where: { name: item.name },
      select: { id: true },
    })
    if (existing) {
      console.log(`  跳过（已存在）: ${item.name.slice(0, 30)}`)
      continue
    }

    // 生成 slug
    const slug = `market-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    await prisma.project.create({
      data: {
        slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        contentType: item.contentType as any,
        category: item.category,
        skills: item.skills,
        budgetType: item.budgetType as any ?? null,
        budgetMin: item.budgetMin ?? null,
        budgetMax: item.budgetMax ?? null,
        deadline: item.deadline ? new Date(item.deadline) : null,
        contactType: item.contactType,
        contactInfo: item.contactInfo,
        status: 'PUBLISHED',
        featured: item.featured ?? false,
        ownerId,
      },
    })
    marketCount++
    console.log(`  ✅ [${item.contentType}] ${item.name.slice(0, 35)}`)
  }
  console.log(`  合计新增: ${marketCount} 条\n`)

  // ── 3. 补用户赛道字段 ──
  console.log('👤 补充用户赛道字段...')
  let userUpdateCount = 0
  for (const [username, tracks] of Object.entries(USER_TRACKS)) {
    const result = await prisma.user.updateMany({
      where: { username, mainTrack: null },
      data: tracks,
    })
    if (result.count > 0) {
      userUpdateCount++
      console.log(`  ✅ ${username}: ${tracks.mainTrack} · ${tracks.startupStage}`)
    }
  }
  console.log(`  合计更新: ${userUpdateCount} 个用户\n`)

  console.log('🎉 Week 2 Seed 完成！')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
