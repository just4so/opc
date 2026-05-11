/**
 * 中国经营报「探路一人公司」专题 — 正文摘要补全脚本
 *
 * 功能：
 *   - 遍历 radar_cb_articles 中 summary 为 NULL 的记录
 *   - 用 CDP 打开文章页面，提取正文前 500 字作为 summary
 *   - 批量更新数据库
 *
 * 触发方式：
 *   npx tsx scripts/collect-cb.ts
 *
 * 正文选择器（2026-05-10 验证）：
 *   div.content_page → 分页正文块
 *   div.article_info → 含正文的父容器
 *
 * 更新时间：2026-05-10
 */

import * as http from 'http'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config({ path: require('path').join(__dirname, '..', '.env.local') })

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
  await navigateAndWait(tabId, url, 2000)

  const result = await cdpEval(tabId, `
    (() => {
      // CB 文章正文在 div.content_page 里（可能有多页）
      const pages = document.querySelectorAll('div.content_page')
      if (pages.length > 0) {
        let text = ''
        pages.forEach(p => { text += p.innerText + '\\n' })
        return text.trim().slice(0, 500)
      }
      // fallback: div.article_info
      const info = document.querySelector('div.article_info')
      if (info) return info.innerText.trim().slice(0, 500)
      // fallback: p_y_20 容器
      const py = document.querySelector('div.p_y_20')
      if (py) return py.innerText.trim().slice(0, 500)
      // 最终 fallback
      return document.body?.innerText?.slice(0, 500) ?? ''
    })()
  `) as string

  // 清理：去掉多余空白
  return (result ?? '').trim().replace(/\s+/g, ' ')
}

// ── 主流程 ─────────────────────────────────────────────────────────────────

async function main() {
  // 1. 检查浏览器
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

  // 2. 查找需要补全 summary 的记录
  const articles = await (prisma as any).radarCbArticle.findMany({
    where: { summary: null },
    select: { id: true, title: true, url: true },
    orderBy: { collectedAt: 'asc' },
  })

  console.log(`\n📋 需要补全 summary 的文章: ${articles.length} 篇`)

  if (articles.length === 0) {
    console.log('✅ 所有文章已有 summary，无需操作')
    await (prisma as any).$disconnect()
    return
  }

  // 3. 逐篇提取正文
  let success = 0
  let failed = 0

  for (const article of articles) {
    try {
      const summary = await fetchArticleContent(tabId, article.url)
      if (summary && summary.length > 20) {
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
        console.log(`  ⚠️ 正文过短: ${article.title.slice(0, 30)}`)
      }
    } catch (e: any) {
      failed++
      console.log(`  ❌ 失败: ${article.title.slice(0, 30)} - ${e.message}`)
    }

    // 每篇间隔 1s，避免被封
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n✅ 完成 — 成功 ${success} 篇，失败 ${failed} 篇`)
  await (prisma as any).$disconnect()
}

main().catch(e => {
  console.error('脚本异常:', e)
  process.exit(1)
})
