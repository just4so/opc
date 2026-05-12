import { PrismaClient } from '@prisma/client'

async function main() {
  const p = new PrismaClient()
  const issue = await p.radarIssue.findFirst({
    orderBy: { issueNo: 'desc' },
    include: { items: { orderBy: { category: 'asc' } } }
  })
  if (issue) {
    console.log('issueNo:', issue.issueNo)
    console.log('title:', issue.title)
    console.log('summary:', issue.summary?.slice(0, 120))
    console.log('items:', issue.items.length)
    const cats: Record<string, number> = {}
    for (const it of issue.items) { cats[it.category] = (cats[it.category] || 0) + 1 }
    console.log('categories:', JSON.stringify(cats))
    issue.items.slice(0, 5).forEach(it =>
      console.log(`[${it.category}] ${it.title.slice(0, 50)} | ${it.url.slice(0, 60)}`)
    )
  }
  await p.$disconnect()
}

main()
