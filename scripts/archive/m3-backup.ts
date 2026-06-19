import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 建备份表
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "_migration_m3_projects_backup" AS
    SELECT * FROM "Project"
    WHERE "contentType" IN ('DEMAND', 'COOPERATION')
  `
  
  const count = await prisma.$queryRaw<{cnt: bigint}[]>`
    SELECT COUNT(*) as cnt FROM "_migration_m3_projects_backup"
  `
  console.log(`✅ 备份完成：${count[0].cnt} 条数据已备份到 _migration_m3_projects_backup`)

  // 打印备份内容确认
  const rows = await prisma.$queryRaw<{id: string, name: string, contentType: string}[]>`
    SELECT id, name, "contentType" FROM "_migration_m3_projects_backup" ORDER BY "contentType", "createdAt"
  `
  console.log('\n备份的记录：')
  rows.forEach(r => console.log(`  [${r.contentType}] ${r.name} (${r.id})`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
