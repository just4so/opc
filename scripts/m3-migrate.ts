/**
 * M3 迁移脚本：Project(DEMAND/COOPERATION) → Post
 * 执行：tsx scripts/m3-migrate.ts
 */

import { PrismaClient, PostType, PostStatus, BudgetType } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

type MigrationEntry = { projectId: string; postId: string; name: string }

async function main() {
  console.log('=== M3 迁移脚本 ===\n')

  // Step 1：确认备份表存在
  const backupCount = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) as cnt FROM "_migration_m3_projects_backup"
  `
  console.log(`✅ 备份表存在：${backupCount[0].cnt} 条记录`)

  // Step 2：获取待迁移的 Project 记录
  const projects = await prisma.project.findMany({
    where: {
      contentType: { in: ['DEMAND', 'COOPERATION'] },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\n待迁移 Project 数量：${projects.length}`)
  if (projects.length !== 27) {
    console.warn(`⚠️  预期 27 条，实际 ${projects.length} 条，请确认`)
  }

  const migrationMap: MigrationEntry[] = []

  // Step 3：逐条迁移
  console.log('\n--- 开始迁移 ---')
  for (const project of projects) {
    const postType: PostType = project.contentType === 'DEMAND' ? PostType.COLLAB : PostType.SHARE
    const postStatus: PostStatus = project.status === 'PUBLISHED' ? PostStatus.PUBLISHED : PostStatus.HIDDEN

    const newPost = await prisma.post.create({
      data: {
        title: project.name,
        content: project.description,
        type: postType,
        status: postStatus,
        authorId: project.ownerId,
        skills: project.skills,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        budgetType: project.budgetType as BudgetType | null,
        deadline: project.deadline,
        contactInfo: project.contactInfo,
        contactType: project.contactType,
        images: project.images,
      },
    })

    // 补写原始 createdAt（Prisma create 不支持直接传 createdAt）
    await prisma.$executeRaw`
      UPDATE "Post" SET "createdAt" = ${project.createdAt} WHERE id = ${newPost.id}
    `

    migrationMap.push({ projectId: project.id, postId: newPost.id, name: project.name })
    console.log(`  ✓ [${project.contentType}] ${project.name} → postId: ${newPost.id}`)
  }

  console.log(`\n✅ 迁移完成：${migrationMap.length} 条 Post 已创建`)

  // Step 4：迁移 Comment（projectId → postId）
  console.log('\n--- 迁移 Comment ---')
  let totalCommentsMigrated = 0
  for (const entry of migrationMap) {
    const result = await prisma.comment.updateMany({
      where: { projectId: entry.projectId },
      data: { projectId: null, postId: entry.postId },
    })
    if (result.count > 0) {
      console.log(`  ✓ Project ${entry.projectId} → Post ${entry.postId}: ${result.count} 条 Comment`)
      totalCommentsMigrated += result.count
    }
  }
  console.log(`✅ Comment 迁移完成：共 ${totalCommentsMigrated} 条`)

  // Step 5：迁移 Favorite（projectId → postId）
  console.log('\n--- 迁移 Favorite ---')
  let totalFavoritesMigrated = 0
  for (const entry of migrationMap) {
    const result = await prisma.favorite.updateMany({
      where: { projectId: entry.projectId },
      data: { projectId: null, postId: entry.postId },
    })
    if (result.count > 0) {
      console.log(`  ✓ Project ${entry.projectId} → Post ${entry.postId}: ${result.count} 条 Favorite`)
      totalFavoritesMigrated += result.count
    }
  }
  console.log(`✅ Favorite 迁移完成：共 ${totalFavoritesMigrated} 条`)

  // Step 6：验证迁移结果
  console.log('\n--- 验证报告 ---')
  const projectIds = migrationMap.map((e) => e.projectId)
  const postIds = migrationMap.map((e) => e.postId)

  const migratedPostCount = await prisma.post.count({
    where: { id: { in: postIds } },
  })
  console.log(`Post 数量验证：预期 27，实际 ${migratedPostCount} ${migratedPostCount === 27 ? '✅' : '❌'}`)

  const remainingComments = await prisma.comment.count({
    where: { projectId: { in: projectIds } },
  })
  console.log(`剩余未迁移 Comment：${remainingComments} ${remainingComments === 0 ? '✅' : '❌'}`)

  const remainingFavorites = await prisma.favorite.count({
    where: { projectId: { in: projectIds } },
  })
  console.log(`剩余未迁移 Favorite：${remainingFavorites} ${remainingFavorites === 0 ? '✅' : '❌'}`)

  // Step 7：软删除 Project（status → ARCHIVED）
  console.log('\n--- 软删除 Project ---')
  const archiveResult = await prisma.project.updateMany({
    where: {
      contentType: { in: ['DEMAND', 'COOPERATION'] },
    },
    data: { status: 'ARCHIVED' },
  })
  console.log(`✅ 已将 ${archiveResult.count} 条 Project 状态改为 ARCHIVED`)

  // 最终确认
  const remainingActive = await prisma.project.count({
    where: {
      contentType: { in: ['DEMAND', 'COOPERATION'] },
      status: { not: 'ARCHIVED' },
    },
  })
  console.log(`仍为非 ARCHIVED 的 DEMAND/COOPERATION 数量：${remainingActive} ${remainingActive === 0 ? '✅' : '❌'}`)

  // 打印迁移映射表
  console.log('\n=== 迁移映射表（projectId → postId）===')
  migrationMap.forEach((e) => {
    console.log(`  ${e.projectId} → ${e.postId}  (${e.name})`)
  })

  console.log('\n=== 迁移完成 ===')
  console.log(`  迁移 Post: ${migratedPostCount} 条`)
  console.log(`  迁移 Comment: ${totalCommentsMigrated} 条`)
  console.log(`  迁移 Favorite: ${totalFavoritesMigrated} 条`)
  console.log(`  软删除 Project: ${archiveResult.count} 条`)
  console.log(`  备份表: _migration_m3_projects_backup（未删除）`)
}

main().catch((e) => {
  console.error('❌ 迁移失败：', e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
