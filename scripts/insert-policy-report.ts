import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const COVER_IMAGE = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/report/2026-opc-policy/cover.jpg'
const PUBLISHED_AT = new Date('2026-05-12T23:00:00+08:00')

const chapters = [
  {
    num: 1,
    title: '《2026中国OPC发展政策研究报告》第一章：研究说明',
    summary: '在展开分析之前，先划定边界——我们研究了什么、没研究什么、用什么方法。这个边界决定了本报告能回答什么，不能回答什么。',
  },
  {
    num: 2,
    title: '第二章：政策浪潮——一条从试探到爆发的探索曲线',
    summary: '109条政策的时间分布、地域传导与层级结构，还原这轮政策爆发的真实节奏。',
  },
  {
    num: 3,
    title: '第三章：工具图谱——标配之外，谁在真正差异化？',
    summary: '拆解109条政策的扶持工具，识别哪些是标配、哪些是真正的差异化创新。',
  },
  {
    num: 4,
    title: '第四章：区域策略——三种城市逻辑，三种选择路径',
    summary: '生态先导、供应链赋能、制度借势——三种策略背后是三种完全不同的城市定位。',
  },
  {
    num: 5,
    title: '第五章：有效实践的提炼——好政策长什么样？',
    summary: '深度总结有效政策的四项共同规律，重点剖析武汉、东莞、胶州、永州、合肥五个标杆案例。',
  },
  {
    num: 6,
    title: '第六章：探索中的普遍困境——为什么好政策落地难？',
    summary: '政策热潮背后的系统性问题：同质化、供需错位、反馈回路缺失、持续性隐忧、认知错位。',
  },
  {
    num: 7,
    title: '第七章：下一阶段的演化方向——政策竞争的下半场',
    summary: '从「给钱给空间」转向「找客户找订单」，七个维度的演化信号与差异化窗口。',
  },
  {
    num: 8,
    title: '第八章：行动参照系——三类角色的实操坐标',
    summary: '给政策制定者、社区运营方、产业研究者与投资人，基于109条政策分析提炼的具体决策框架。',
  },
]

async function main() {
  const results = []

  for (const chapter of chapters) {
    const url = `https://www.opcquan.com/report/2026-opc-policy/chapter-${chapter.num}`
    
    // Read the markdown content
    const contentPath = `/tmp/opc_chapters/chapter_${String(chapter.num).padStart(2, '0')}.md`
    let content: string
    try {
      content = readFileSync(contentPath, 'utf-8')
    } catch (e) {
      console.error(`Failed to read ${contentPath}:`, e)
      continue
    }

    // Check if record already exists
    const existing = await prisma.news.findUnique({ where: { url } })
    if (existing) {
      console.log(`SKIP (already exists): ${url} (id: ${existing.id})`)
      results.push({ id: existing.id, title: chapter.title, status: 'skipped' })
      continue
    }

    try {
      const record = await prisma.news.create({
        data: {
          title: chapter.title,
          summary: chapter.summary,
          content: content,
          url: url,
          source: 'OPC圈编辑部',
          category: 'REPORT' as any,
          isOriginal: true,
          author: 'OPC圈编辑部',
          coverImage: COVER_IMAGE,
          publishedAt: PUBLISHED_AT,
        },
      })
      console.log(`CREATED: id=${record.id} | ${chapter.title}`)
      results.push({ id: record.id, title: chapter.title, status: 'created' })
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`SKIP (duplicate): ${url}`)
        results.push({ id: 'N/A', title: chapter.title, status: 'skipped_duplicate' })
      } else {
        console.error(`ERROR for chapter ${chapter.num}:`, e.message)
        results.push({ id: 'ERROR', title: chapter.title, status: 'error', error: e.message })
      }
    }
  }

  console.log('\n=== RESULTS ===')
  for (const r of results) {
    console.log(`${r.status.toUpperCase()} | id=${r.id} | ${r.title}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
