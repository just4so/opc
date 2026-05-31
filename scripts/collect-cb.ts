/**
 * 中国经营报「探路一人公司」专题 — 正文摘要补全脚本
 *
 * 功能：
 *   - 遍历 radar_cb_articles 中 summary 为 NULL（或脏数据）的记录
 *   - 用 CDP 打开文章页面，提取正文
 *   - 调 AI 提炼 40-80 字摘要后写入 summary
 *
 * 触发方式：
 *   npx tsx scripts/collect-cb.ts              # 只处理 summary=null
 *   npx tsx scripts/collect-cb.ts --reprocess  # 同时处理脏数据（中经记者开头/反爬内容）
 *
 * 正文选择器（2026-05-10 验证）：
 *   div.content_page → 分页正文块
 *   div.article_info → 含正文的父容器
 *
 * 更新时间：2026-05-31
 */

import * as http from 'http'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') })

import { getAIClient } from '../lib/radar/aiJudge'

const prisma = new PrismaClient()

const CDP_PORT = 18800

// ── Node http helper ───────────────────────────────────────────────────────

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (c: Buffer) => data += c.toString())
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

// ── CDP helpers ────────────────────────────────────────────────────────────

async function getActiveTabs(): Promise<Array<{ id: string; url: string; type: string }>> {
  const raw = await httpGet(`http://127.0.0.1:${CDP_PORT}/json`)
  return JSON.parse(raw)
}

function cdpEval(tabId: string, expression: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new (require('ws'))(`ws://127.0.0.1:${CDP_PORT}/devtools/page/${tabId}`)
    const timer = setTimeout(() => { ws.close(); reject(new Error('CDP timeout')) }, 20000)

    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }))
    })
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.id === 1) {
          clearTimeout(timer)
          ws.close()
          resolve(msg?.result?.result?.value)
        }
      } catch (e) { clearTimeout(timer); ws.close(); reject(e) }
    })
    ws.on('error', (e: Error) => { clearTimeout(timer); reject(e) })
  })
}

async function navigateAndWait(tabId: string, url: string, waitMs = 2000): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ws = new (require('ws'))(`ws://127.0.0.1:${CDP_PORT}/devtools/page/${tabId}`)
    const timer = setTimeout(() => { ws.close(); reject(new Error('navigate timeout')) }, 20000)
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url } }))
    })
    ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString())
      if (msg.id === 1) { clearTimeout(timer); ws.close(); resolve() }
    })
    ws.on('error', (e: Error) => { clearTimeout(timer); reject(e) })
  })

  // 等 DOM 完全加载
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500))
    const state = await cdpEval(tabId, 'document.readyState') as string
    if (state === 'complete') break
  }

  await new Promise(r => setTimeout(r, waitMs))
}

// ── 正文提取（修复版） ─────────────────────────────────────────────────────

async function fetchArticleContent(tabId: string, url: string): Promise<string> {
  await navigateAndWait(tabId, url, 3000)

  const result = await cdpEval(tabId, `
    (() => {
      const pages = document.querySelectorAll('div.content_page')
      if (pages.length > 0) {
        let text = ''
        pages.forEach(p => { text += p.innerText + '\\n' })
        return text.trim().slice(0, 2000)
      }
      const info = document.querySelector('div.article_info')
      if (info) return info.innerText.trim().slice(0, 2000)
      const py = document.querySelector('div.p_y_20')
      if (py) return py.innerText.trim().slice(0, 2000)
      return document.body?.innerText?.slice(0, 2000) ?? ''
    })()
  `) as string

  return (result ?? '').trim().replace(/\s+/g, ' ')
}

// ── AI 摘要提炼 ──────────────────────────────────────────────────────────────

async function aiSummarize(rawText: string, title: string, ai: any): Promise<string | null> {
  const prompt = `你是 OPC 雷达编辑。基于以下文章正文，为标题「${title}」写一句摘要（40-80字），聚焦核心事实，去掉"中经记者 XX 报道"等前言，直接写内容。只返回摘要文本，不加引号前缀。

正文：${rawText.slice(0, 1000)}`

  try {
    const comp = await Promise.race([
      ai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('AI timeout')), 15000)),
    ])
    const result = (comp as any).choices[0]?.message?.content?.trim()
    if (!result || result.length < 20) return null
    if (/无法|未知|未提供/.test(result)) return null
    return result
  } catch (e: any) {
    console.log(`    AI 失败: ${e.message?.slice(0, 60)}`)
    return null
  }
}

// ── 主流程 ─────────────────────────────────────────────────────────────────

async function main() {
  const reprocess = process.argv.includes('--reprocess')

  // 1. 初始化 AI client
  const ai = getAIClient()
  if (!ai) {
    console.error('❌ 无 AI Key（DEEPSEEK_API_KEY），无法提炼摘要，退出')
    process.exit(1)
  }

  // 2. 检查浏览器
  let tabs: Array<{ id: string; url: string; type: string }>
  try {
    tabs = await getActiveTabs()
  } catch {
    console.error('❌ 浏览器未启动（CDP 端口 18800 无响应），退出')
    process.exit(1)
  }

  const pageTab = tabs.find(t => t.type === 'page' && !t.url.startsWith('chrome')) ?? tabs.find(t => t.type === 'page')
  if (!pageTab) {
    console.error('❌ 没有可用的 page tab')
    process.exit(1)
  }

  const tabId = pageTab.id
  console.log(`✓ 使用 tab: ${pageTab.url.slice(0, 60)}`)

  // 3. 查找需要处理的记录
  const whereConditions: any[] = [{ summary: null }]
  if (reprocess) {
    whereConditions.push(
      { summary: { startsWith: '中经记者' } },
      { summary: { contains: '创宇盾' } },
      { summary: { contains: '访问频率' } },
    )
  }

  const articles = await (prisma as any).radarCbArticle.findMany({
    where: { OR: whereConditions },
    select: { id: true, title: true, url: true, summary: true },
    orderBy: { collectedAt: 'asc' },
  })

  console.log(`\n📋 需要处理的文章: ${articles.length} 篇${reprocess ? '（含脏数据重处理）' : ''}`)

  if (articles.length === 0) {
    console.log('✅ 无需操作')
    await (prisma as any).$disconnect()
    return
  }

  // 4. 逐篇提取正文 + AI 摘要
  let success = 0
  let skipped = 0
  let failed = 0

  for (const article of articles) {
    try {
      const rawText = await fetchArticleContent(tabId, article.url)

      if (!rawText || rawText.length < 50) {
        skipped++
        console.log(`  ⚠️ 正文过短/反爬拦截，跳过: ${article.title.slice(0, 30)}`)
        continue
      }

      const summary = await aiSummarize(rawText, article.title, ai)
      if (summary) {
        await (prisma as any).radarCbArticle.update({
          where: { id: article.id },
          data: { summary },
        })
        success++
        if (success % 10 === 0) {
          console.log(`  进度: ${success}/${articles.length}`)
        }
      } else {
        failed++
        console.log(`  ⚠️ AI 无有效摘要: ${article.title.slice(0, 30)}`)
      }
    } catch (e: any) {
      failed++
      console.log(`  ❌ 失败: ${article.title.slice(0, 30)} - ${e.message}`)
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n✅ 完成 — 成功 ${success} 篇，跳过 ${skipped} 篇，失败 ${failed} 篇`)
  await (prisma as any).$disconnect()
}

main().catch(e => {
  console.error('脚本异常:', e)
  process.exit(1)
})
