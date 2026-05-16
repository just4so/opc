#!/usr/bin/env tsx
/**
 * OPC Radar 每日采集 + 生成脚本（全本地执行）
 *
 * Phase 1: Google News 采集（走代理，8 个查询）
 * Phase 2: RSS 直连采集（人民日报/36氪/澎湃等，不需要代理）
 * Phase 3: 统计未发布条目数
 * Phase 4: 生成新一期（含 AI 编辑审核 + 中经报保底）
 *
 * 用法：npx tsx scripts/daily-run.ts
 * cron：0 8 * * * cd /Users/wei/Documents/opc && /usr/local/bin/npx tsx scripts/daily-run.ts >> /tmp/opc-radar-daily.log 2>&1
 *
 * 更新时间：2026-05-10
 */

import { execSync, spawn } from 'child_process'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(ROOT, '.env.local') })

import { PrismaClient } from '@prisma/client'
import { getAIClient, judgeItem, isTooOld } from '../lib/radar/aiJudge'
import { collectRssFeeds, collectTier3, type RadarRawItem } from '../lib/radar/rssProvider'
import { FILTER_KEYWORDS } from '../config/search-queries'
import { generateIssue } from '../lib/radar/generateIssue'

const prisma = new PrismaClient()

// ─── 工具函数 ─────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] ${msg}`)
}

function run(cmd: string): string {
  log(`$ ${cmd}`)
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 240000 })
  } catch (e: any) {
    log(`  ⚠️ 命令退出码非零: ${e.message?.split('\n')[0]}`)
    return e.stdout || ''
  }
}

async function notifyFeishu(msg: string): Promise<void> {
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET
  const userId = process.env.FEISHU_NOTIFY_USER_ID
  if (!appId || !appSecret || !userId) return

  try {
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    })
    const { tenant_access_token } = await tokenRes.json() as any

    await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tenant_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: userId,
        msg_type: 'text',
        content: JSON.stringify({ text: msg }),
      }),
    })
  } catch (e) {
    log(`飞书通知发送失败: ${e}`)
  }
}

// ─── RSS 采集逻辑（内联，不走 API route）─────────────────────────────────

const SOURCE_BLOCKLIST = ['facebook.com', 'baike.baidu.com', 'bendibao.com', 'taogongwei.com']

async function collectRss(): Promise<{ collected: number; skipped: number }> {
  let collected = 0, skipped = 0
  const aiClient = getAIClient()

  // Tier 1 + 2 RSS
  const rssResult = await collectRssFeeds({ tiers: [1, 2], maxPerSource: 20, concurrency: 6, minPublishedDays: 7 })
  // Tier 3 with keyword filter
  const tier3Items = await collectTier3(FILTER_KEYWORDS)
  const allItems: RadarRawItem[] = [...rssResult.items, ...tier3Items]

  const filtered = allItems.filter((item) => {
    try {
      const hostname = new URL(item.url).hostname
      if (SOURCE_BLOCKLIST.some((b) => hostname.includes(b))) return false
    } catch { return false }
    if (item.tier <= 2) return true
    const text = `${item.title} ${item.content}`
    return FILTER_KEYWORDS.some((kw) => text.includes(kw))
  })

  for (const item of filtered) {
    // 时间硬过滤
    if (isTooOld(item.publishedAt, null)) { skipped++; continue }
    // URL 去重
    const existsByUrl = await prisma.radarItem.findFirst({ where: { url: item.url }, select: { id: true } })
    if (existsByUrl) { skipped++; continue }
    // 标题去重
    const existsByTitle = await prisma.radarItem.findFirst({ where: { title: item.title }, select: { id: true } })
    if (existsByTitle) { skipped++; continue }

    if (!aiClient) {
      try {
        await prisma.radarItem.create({
          data: { title: item.title, url: item.url, source: item.source, publishedAt: item.publishedAt, category: item.category ?? 'content', importance: 2 },
        })
        collected++
      } catch { skipped++ }
      continue
    }

    // AI 判断
    const aiResult = await judgeItem(aiClient, {
      title: item.title, content: item.content, url: item.url,
      publishedAt: item.publishedAt?.toISOString().slice(0, 10),
      baseImportanceBonus: item.baseImportanceBonus,
    })

    if (!aiResult.relevant) { skipped++; continue }
    if (isTooOld(item.publishedAt, aiResult.estimated_date)) { skipped++; continue }

    let importance = Math.max(1, Math.min(5, aiResult.importance ?? 3))
    if (!aiResult.is_recent && importance > 2) importance = 2

    let finalPublishedAt = item.publishedAt
    if (!finalPublishedAt && aiResult.estimated_date) {
      const d = new Date(aiResult.estimated_date)
      finalPublishedAt = isNaN(d.getTime()) ? null : d
    }
    if (!finalPublishedAt) { skipped++; continue }

    try {
      await prisma.radarItem.create({
        data: {
          title: item.title, url: item.url, source: item.source, publishedAt: finalPublishedAt,
          summary: aiResult.summary ?? null, category: aiResult.category ?? item.category ?? 'content',
          city: aiResult.city ?? null, importance, eventKey: aiResult.event_key ?? null,
        },
      })
      collected++
    } catch { skipped++ }
  }

  return { collected, skipped }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────

async function main() {
  log('=== OPC Radar 每日采集开始 ===')

  // Phase 1: Google News 采集（后台异步，不阻塞主流程）
  log('--- Phase 1: Google News 采集（后台启动）---')
  const gnewsProc = spawn('npx', ['tsx', 'scripts/collect-gnews.ts', '3'], {
    cwd: ROOT,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })
  let gnewsOutput = ''
  gnewsProc.stdout?.on('data', (d: Buffer) => { gnewsOutput += d.toString() })
  gnewsProc.stderr?.on('data', (d: Buffer) => { gnewsOutput += d.toString() })
  // 等待最多 240 秒，超时则继续主流程
  const gnewsDone = new Promise<void>(resolve => {
    const timer = setTimeout(() => {
      log('  ⚠️ GNews 采集超时（240s），继续主流程')
      gnewsProc.kill()
      resolve()
    }, 240000)
    gnewsProc.on('close', () => { clearTimeout(timer); resolve() })
  })
  await gnewsDone
  const gnewsLines = gnewsOutput.trim().split('\n').filter(l => l.includes('✓') || l.includes('⚠️') || l.includes('saved')).slice(-4).join(' | ')
  log(`GNews 结果: ${gnewsLines || '无输出'}`)

  // Phase 2: RSS 直连采集
  log('--- Phase 2: RSS 直连采集 ---')
  const rssStats = await collectRss()
  log(`RSS 采集完成：collected=${rssStats.collected}, skipped=${rssStats.skipped}`)

  // 写 RadarRun 记录（RSS 部分）
  await prisma.radarRun.create({
    data: { source: 'rss-daily', collected: rssStats.collected, skipped: rssStats.skipped, error: null },
  })

  // Phase 3: 统计
  const unpublished = await prisma.radarItem.count({ where: { issueId: null } })
  log(`--- Phase 3: 未发布条目 ${unpublished} 条 ---`)

  if (unpublished < 5) {
    log(`⚠️ 条目不足 5 条（当前 ${unpublished}），跳过本期生成`)
    log('=== 完成（无新期刊） ===')
    return
  }

  // Phase 4: 生成新一期
  log('--- Phase 4: 生成新一期 ---')
  const issueResult = await generateIssue(prisma)

  if (issueResult) {
    log(`✅ Issue #${issueResult.issueNo} 生成成功（${issueResult.itemCount} 条，编辑审核去除 ${issueResult.editorialRemoved ?? 0} 条）`)

    // 飞书通知：带内容预览
    const issueData = await prisma.radarIssue.findFirst({
      where: { id: issueResult.issueId },
      include: { items: { orderBy: [{ importance: 'desc' }], take: 5, select: { title: true, category: true, importance: true } } },
    })
    const catStats = issueData?.items.reduce((acc: Record<string, number>, i: any) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1; return acc
    }, {})
    const catLine = Object.entries(catStats ?? {}).map(([k, v]) => `${k}(${v})`).join(' / ')
    const topTitles = issueData?.items.slice(0, 3).map((i: any, idx: number) => `  ${idx + 1}. [${i.category}] ${i.title.slice(0, 30)}`).join('\n') ?? ''
    const notifyMsg = `✅ OPC Radar Issue #${issueResult.issueNo} 已生成（${issueResult.itemCount} 条）\n分类：${catLine}\n\n精选预览：\n${topTitles}\n\n🔗 https://opcquan.com/radar`
    await notifyFeishu(notifyMsg)
  } else {
    log('⚠️ 本次未生成新期刊（条目不足或分类不够）')
  }

  log('=== OPC Radar 每日采集完成 ===')
}

// ─── 数据库连接重试 ───────────────────────────────────────────────────────

async function waitForDb(maxRetries = 3, delayMs = 30000): Promise<void> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      if (i > 1) log(`✅ 数据库连接恢复（第 ${i} 次重试成功）`)
      return
    } catch (e: any) {
      if (i === maxRetries) throw e
      log(`⚠️ 数据库连接失败（第 ${i}/${maxRetries} 次），${delayMs / 1000}s 后重试...`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

waitForDb()
  .then(() => main())
  .catch(async (e) => {
    console.error('Fatal:', e)
    await notifyFeishu(`❌ OPC Radar 每日采集失败\n${String(e).slice(0, 200)}`)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
