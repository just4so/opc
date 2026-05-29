import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Like → Favorite 迁移脚本 ===\n')

  const likes = await prisma.like.findMany()
  console.log(`总 Like 记录数: ${likes.length}`)

  let migrated = 0
  let skipped = 0

  for (const like of likes) {
    const where = like.postId
      ? { userId_postId: { userId: like.userId, postId: like.postId } }
      : like.projectId
        ? { userId_projectId: { userId: like.userId, projectId: like.projectId } }
        : null

    if (!where) {
      skipped++
      continue
    }

    const existing = await prisma.favorite.findUnique({ where })

    if (existing) {
      skipped++
      continue
    }

    await prisma.favorite.create({
      data: {
        userId: like.userId,
        postId: like.postId,
        projectId: like.projectId,
        createdAt: like.createdAt,
      },
    })
    migrated++
  }

  console.log(`\n迁移完成:`)
  console.log(`  新增 Favorite: ${migrated}`)
  console.log(`  跳过（已存在或无效）: ${skipped}`)
  console.log(`  总计处理: ${likes.length}`)
}

main()
  .catch((e) => {
    console.error('迁移失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
