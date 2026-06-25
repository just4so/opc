import prisma from '../lib/db'

async function main() {
  const result = await prisma.news.updateMany({
    where: { isOriginal: false },
    data: { hidden: true },
  })
  console.log(`已将 ${result.count} 条 RSS 资讯设为隐藏`)
  await prisma.$disconnect()
}

main().catch(console.error)
