#!/usr/bin/env tsx
/**
 * OPC Radar 公众号草稿生成脚本
 *
 * 功能：从 DB 读指定期 issue + items → 生成封面+内容图 → 推公众号草稿箱
 *
 * 用法：
 *   npx tsx scripts/generate-wechat-draft.ts              # 最新一期
 *   npx tsx scripts/generate-wechat-draft.ts --issue 3    # 指定期号
 *   npx tsx scripts/generate-wechat-draft.ts --dry-run    # 只生成图，不推送
 *
 * 输出图片（临时）：/tmp/opc-radar-cover.png, /tmp/opc-radar-*.png
 * 封面规格：900×383px（输出 1800×766 @2x）
 * 内容图：1440px 宽（720 viewport @2x），高度自适应内容
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

const prisma = new PrismaClient()

// ─── CLI 参数 ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const issueArg = args.find(a => a.startsWith('--issue='))?.split('=')[1]
              ?? args[args.indexOf('--issue') + 1]
const DRY_RUN = args.includes('--dry-run')
const TARGET_ISSUE = issueArg ? parseInt(issueArg) : null

// ─── 常量 ────────────────────────────────────────────────────────────────────
const LOGO_PATH = path.join(__dirname, '../public/logo-wordmark.png')
const TMP_DIR = '/tmp'

const CATEGORY_META: Record<string, [string, string, string]> = {
  policy:    ['01', '政策动向', 'POLICY TRENDS'],
  event:     ['02', '活动赛事', 'EVENTS'],
  content:   ['03', '实战案例', 'CASE STUDIES'],
  opinion:   ['04', '新锐观点', 'OPINIONS'],
  community: ['05', '社区动态', 'COMMUNITY NEWS'],
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────
function weekdayStr(date: Date): string {
  return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
}

function dateStr(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function issueLabel(issueNo: number, publishedAt: Date): string {
  return `${publishedAt.getMonth() + 1}月第${issueNo}期`
}

// ─── HTML 生成 ───────────────────────────────────────────────────────────────
function itemHtml(item: any): string {
  const badge = item.importance >= 4
    ? '<span style="background:#f97316;color:#fff;font-size:11px;padding:1px 5px;border-radius:3px;font-weight:500;vertical-align:middle;margin-left:6px;">重要</span>'
    : ''
  const cityHtml = item.city
    ? `<span style="color:#78716c;font-size:12px;padding-left:6px;">${item.city}</span>`
    : ''
  const pubDate = new Date(item.publishedAt)
  const dateLabel = `${pubDate.getMonth()+1}/${pubDate.getDate()}`
  return (
    `<p style="border-bottom:1px solid #f0ede8;padding:14px 0;margin:0;">` +
    `<span style="display:block;font-size:15px;font-weight:600;color:#1c1917;line-height:1.6;padding-bottom:6px;">${item.title}${badge}</span>` +
    `<span style="background:#fff0e0;color:#c2410c;font-size:12px;padding:2px 7px;border-radius:3px;font-weight:500;">${item.source}</span>` +
    cityHtml +
    `<span style="color:#a8a29e;font-size:12px;padding-left:6px;">${dateLabel}</span><br>` +
    `<span style="font-size:13px;color:#78716c;line-height:1.7;">${item.summary ?? ''}</span>` +
    `</p>`
  )
}

function sectionHtml(catKey: string, items: any[]): string {
  const [num, name, en] = CATEGORY_META[catKey] ?? ['--', catKey, catKey.toUpperCase()]
  return (
    `<section style="padding:20px 24px 0;margin-top:8px;">` +
    `<p style="margin:0;padding:0 0 12px;border-bottom:2px solid #f0ede8;font-size:0;">` +
    `<span style="display:inline-block;vertical-align:bottom;font-size:38px;font-weight:900;color:#f97316;line-height:1;padding-right:10px;">${num}</span>` +
    `<span style="display:inline-block;vertical-align:bottom;">` +
    `<span style="display:block;font-size:19px;font-weight:700;color:#1c1917;line-height:1.3;">${name}</span>` +
    `<span style="display:block;font-size:11px;letter-spacing:2px;color:#a8a29e;">${en}</span>` +
    `</span></p></section>` +
    `<section style="padding:0 24px 16px;">${items.map(itemHtml).join('')}</section>`
  )
}

function wrapPage(body: string): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="UTF-8">` +
    `<style>*{box-sizing:border-box;}html{margin:0;padding:0;}body{margin:0;padding:0;width:720px;background:#fffbf5;` +
    `font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif;}</style>` +
    `</head><body>${body}</body></html>`
  )
}

function buildCoverHtml(logoB64: string, issue: any, items: any[]): string {
  const pub = new Date(issue.publishedAt)
  const label = issueLabel(issue.issueNo, pub)
  const volStr = `VOL.${pub.getFullYear()}.${String(pub.getMonth()+1).padStart(2,'0')}.${String(pub.getDate()).padStart(2,'0')}`
  // 取 summary 前80字作为摘要
  const digest = (issue.summary ?? '').slice(0, 80) + '…'

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:900px;height:383px;background:#fffbf5;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue",sans-serif;
  position:relative;overflow:hidden;}
.bg-circle{position:absolute;right:-60px;bottom:-60px;width:340px;height:340px;border-radius:50%;background:rgba(249,115,22,0.06);}
.bg-circle2{position:absolute;right:10px;bottom:-10px;width:210px;height:210px;border-radius:50%;border:1px solid rgba(249,115,22,0.12);}
.left-bar{position:absolute;left:0;top:0;bottom:0;width:5px;background:#f97316;}
.top-bar{position:absolute;top:0;left:5px;right:0;height:1px;background:rgba(249,115,22,0.2);}
.inner{position:absolute;top:0;left:0;right:0;bottom:0;padding:28px 56px 28px 54px;display:flex;flex-direction:column;justify-content:space-between;}
.logo-row{display:flex;align-items:center;justify-content:space-between;}
.logo-img{height:36px;}
.radar-label{display:flex;align-items:center;gap:8px;}
.radar-dot{width:7px;height:7px;border-radius:50%;background:#f97316;}
.radar-text{font-size:12px;letter-spacing:4px;color:#a8a29e;text-transform:uppercase;}
.title-block{flex:1;display:flex;flex-direction:column;justify-content:center;padding:10px 0 6px;}
.title-main{font-size:62px;font-weight:900;color:#1c1917;line-height:1.0;letter-spacing:-2px;margin-bottom:8px;}
.title-sub-row{display:flex;align-items:baseline;gap:14px;}
.title-sub{font-size:30px;font-weight:900;color:#f97316;letter-spacing:-1px;}
.title-sub-en{font-size:12px;letter-spacing:3px;color:#c7b8a8;text-transform:uppercase;padding-bottom:3px;}
.digest{font-size:12.5px;color:#78716c;line-height:1.75;padding-left:12px;border-left:3px solid #f97316;max-width:680px;}
.bottom-row{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(28,25,23,0.08);}
.meta{font-size:11px;color:#a8a29e;letter-spacing:2px;}
.dot{color:#f97316;margin:0 7px;}
.site{font-size:11px;color:#d6cfc8;letter-spacing:1px;}
</style></head>
<body>
<div class="bg-circle"></div><div class="bg-circle2"></div>
<div class="left-bar"></div><div class="top-bar"></div>
<div class="inner">
  <div class="logo-row">
    <img class="logo-img" src="data:image/png;base64,${logoB64}">
    <div class="radar-label"><div class="radar-dot"></div><div class="radar-text">Radar · 情报简报</div></div>
  </div>
  <div class="title-block">
    <div class="title-main">OPC 雷达</div>
    <div class="title-sub-row">
      <div class="title-sub">${label}</div>
      <div class="title-sub-en">${volStr}</div>
    </div>
  </div>
  <div class="digest">${digest}</div>
  <div class="bottom-row">
    <div class="meta">${dateStr(pub)}<span class="dot">·</span>星期${weekdayStr(pub)}<span class="dot">·</span>${items.length} ITEMS</div>
    <div class="site">opcquan.com/radar</div>
  </div>
</div>
</body></html>`
}

// ─── Playwright 截图 ─────────────────────────────────────────────────────────
async function renderPages(issue: any, items: any[]): Promise<string[]> {
  const logoB64 = fs.readFileSync(LOGO_PATH).toString('base64')

  // 按 category 分组，保持固定顺序
  const grouped: Record<string, any[]> = {}
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  const catOrder = ['policy', 'event', 'content', 'opinion', 'community']
  const existingCats = catOrder.filter(c => grouped[c]?.length)

  // 将 category 两两分组成多页
  const catPages: string[][] = []
  for (let i = 0; i < existingCats.length; i += 2) {
    catPages.push(existingCats.slice(i, i + 2))
  }

  const pub = new Date(issue.publishedAt)
  const label = issueLabel(issue.issueNo, pub)

  const pages: Record<string, string> = {
    header: wrapPage(
      `<section style="background:#f97316;height:4px;padding:0;margin:0;line-height:0;font-size:0;"></section>` +
      `<section style="padding:28px 24px 20px;text-align:center;border-bottom:2px solid #1c1917;">` +
      `<p style="font-size:11px;letter-spacing:3px;color:#a8a29e;margin:0;padding:0 0 8px;">OPC圈 · RADAR</p>` +
      `<p style="font-size:28px;font-weight:900;color:#1c1917;margin:0;padding:0 0 10px;line-height:1.3;">OPC 雷达 <span style="color:#f97316;">${label}</span></p>` +
      `<p style="font-size:12px;color:#78716c;margin:0;padding:0;letter-spacing:1px;">${dateStr(pub)} / 星期${weekdayStr(pub)} / ${items.length} ITEMS</p>` +
      `</section>` +
      `<section style="padding:20px 24px 24px;">` +
      `<p style="border-left:4px solid #f97316;padding:14px 14px 14px 16px;background:#fdf8f3;font-size:14px;color:#44403c;line-height:1.8;margin:0;">${issue.summary ?? ''}</p>` +
      `</section>`
    ),
  }

  catPages.forEach((cats, idx) => {
    const key = `cat${String(idx + 1).padStart(2, '0')}`
    pages[key] = wrapPage(cats.map(c => sectionHtml(c, grouped[c])).join(''))
  })

  pages['footer'] = wrapPage(
    `<section style="padding:18px 24px;text-align:center;border-top:1px solid #e7e5e4;">` +
    `<p style="font-size:13px;color:#78716c;line-height:1.9;margin:0;">本期情报共 ${items.length} 条，点击底部<strong>「阅读原文」</strong>查看网页完整版及历史期刊。</p>` +
    `</section>` +
    `<section style="padding:20px 24px;background:#1c1917;text-align:center;">` +
    `<p style="font-size:12px;color:#78716c;margin:0;padding:0 0 4px;">OPC圈 · 一人公司情报简报</p>` +
    `<p style="font-size:12px;color:#57534e;margin:0;">opcquan.com/radar</p>` +
    `</section>`
  )

  // 用 Python + Playwright 生成图片（避免 bun/tsx 环境问题）
  const pagesJson = JSON.stringify(pages)
  const coverHtml = buildCoverHtml(logoB64, issue, items)

  const pyScript = `
import json, sys
from playwright.sync_api import sync_playwright

pages = json.loads(sys.argv[1])
cover_html = sys.argv[2]
tmp_dir = sys.argv[3]
out_files = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    # 封面 900x383
    page = browser.new_page(viewport={"width": 900, "height": 383}, device_scale_factor=2)
    page.set_content(cover_html, wait_until="networkidle")
    page.wait_for_timeout(300)
    cover_path = tmp_dir + '/opc-radar-cover.png'
    page.screenshot(path=cover_path, full_page=False)
    out_files.append(cover_path)
    print('cover: ' + cover_path)

    # 内容图 720px viewport @2x，高度自适应
    for name, html in pages.items():
        path_out = tmp_dir + '/opc-radar-' + name + '.png'
        pg = browser.new_page(viewport={"width": 720, "height": 400}, device_scale_factor=2)
        pg.set_content(html, wait_until="networkidle")
        pg.wait_for_timeout(300)
        h = pg.evaluate("document.body.scrollHeight")
        pg.set_viewport_size({"width": 720, "height": h})
        pg.screenshot(path=path_out, full_page=False)
        out_files.append(path_out)
        print('page: ' + path_out)
    browser.close()

print('DONE:' + ','.join(out_files))
`

  fs.writeFileSync('/tmp/_radar_render.py', pyScript)
  const result = execSync(
    `python3 /tmp/_radar_render.py '${pagesJson.replace(/'/g, "\\'")}' '${coverHtml.replace(/'/g, "\\'")}' '${TMP_DIR}'`,
    { maxBuffer: 50 * 1024 * 1024 }
  ).toString()

  console.log(result.split('\n').filter(l => l.startsWith('cover:') || l.startsWith('page:')).join('\n'))

  const doneLine = result.split('\n').find(l => l.startsWith('DONE:'))
  return doneLine ? doneLine.replace('DONE:', '').split(',') : []
}

// ─── 微信 API ────────────────────────────────────────────────────────────────
function httpPost(url: string, data: Buffer | string, headers: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const mod = u.protocol === 'https:' ? https : http
    const req = mod.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST', headers }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve(JSON.parse(body)))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function getToken(appId: string, appSecret: string): Promise<string> {
  const res = await new Promise<any>((resolve, reject) => {
    https.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`,
      res => { let b = ''; res.on('data', d => b += d); res.on('end', () => resolve(JSON.parse(b))) }
    ).on('error', reject)
  })
  if (!res.access_token) throw new Error(`token error: ${JSON.stringify(res)}`)
  return res.access_token
}

async function uploadImage(token: string, filePath: string): Promise<{ mediaId: string; url: string }> {
  const data = fs.readFileSync(filePath)
  const boundary = '----OPCBnd' + Date.now()
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="img.png"\r\nContent-Type: image/png\r\n\r\n`),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  const res = await httpPost(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
    body,
    { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': String(body.length) }
  )
  if (!res.media_id) throw new Error(`upload failed: ${JSON.stringify(res)}`)
  return { mediaId: res.media_id, url: res.url }
}

async function pushDraft(token: string, payload: any): Promise<string> {
  const body = JSON.stringify(payload)
  const res = await httpPost(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
    body,
    { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) }
  )
  if (!res.media_id) throw new Error(`draft failed: ${JSON.stringify(res)}`)
  return res.media_id
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────
async function main() {
  // 1. 读取 issue
  const issue = TARGET_ISSUE
    ? await prisma.radarIssue.findFirst({ where: { issueNo: TARGET_ISSUE } })
    : await prisma.radarIssue.findFirst({ orderBy: { issueNo: 'desc' } })

  if (!issue) throw new Error('找不到 issue，请先运行 daily-run.ts 生成期刊')

  const items = await prisma.radarItem.findMany({
    where: { issueId: issue.id },
    orderBy: [{ importance: 'desc' }, { publishedAt: 'desc' }],
  })

  console.log(`📰 期刊：${issue.title}（${items.length} 条）`)

  // 2. 生成图片
  console.log('🎨 生成图片...')
  const imgFiles = await renderPages(issue, items)
  console.log(`✅ 生成 ${imgFiles.length} 张图片`)

  if (DRY_RUN) {
    console.log('🔍 dry-run 模式，跳过推送')
    console.log('图片路径:', imgFiles)
    return
  }

  // 3. 读取微信配置
  const envPath = path.join(__dirname, '../../aidoc/.env')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const envMap: Record<string, string> = {}
  for (const line of envContent.split('\n')) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.+)$/)
    if (m) envMap[m[1]] = m[2].trim()
  }
  const { WECHAT_APP_ID, WECHAT_APP_SECRET } = envMap
  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) throw new Error('缺少 WECHAT_APP_ID / WECHAT_APP_SECRET')

  // 4. 上传图片
  console.log('📤 上传微信素材库...')
  const token = await getToken(WECHAT_APP_ID, WECHAT_APP_SECRET)

  const coverFile = imgFiles.find(f => f.includes('cover'))!
  const contentFiles = imgFiles.filter(f => !f.includes('cover'))

  const { mediaId: coverMediaId } = await uploadImage(token, coverFile)
  console.log('✅ 封面上传 ok')

  const imgUrls: string[] = []
  for (const f of contentFiles) {
    const { url } = await uploadImage(token, f)
    imgUrls.push(url)
    console.log(`✅ ${path.basename(f)}`)
  }

  // 5. 组装并推送草稿
  const pub = new Date(issue.publishedAt)
  const label = issueLabel(issue.issueNo, pub)
  const imgsHtml = imgUrls.map(u => `<img src="${u}" style="display:block;width:100%;max-width:100%;">`).join('\n')
  const contentHtml = imgsHtml + '<p style="text-align:center;font-size:13px;color:#78716c;padding:16px 0;line-height:1.8;">点击底部<strong>「阅读原文」</strong>查看网页完整版及历史期刊</p>'

  // 标题取 issue 里最重要的一条
  const topItem = items.find(i => i.importance >= 4) ?? items[0]
  const title = `OPC 雷达｜${topItem?.title?.slice(0, 20) ?? label}`
  const digest = (issue.summary ?? '').slice(0, 120)

  const payload = {
    articles: [{
      title, author: 'OPC圈编辑部', digest,
      content: contentHtml,
      content_source_url: `https://opcquan.com/radar/${issue.issueNo}`,
      thumb_media_id: coverMediaId,
      need_open_comment: 1, only_fans_can_comment: 0,
    }],
  }

  console.log('📨 推送草稿...')
  await pushDraft(token, payload)
  console.log(`\n🎉 草稿推送成功！`)
  console.log(`   标题：${title}`)
  console.log(`   阅读原文：https://opcquan.com/radar/${issue.issueNo}`)
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
