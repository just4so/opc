/**
 * 给 avatar 为空的用户分配 DiceBear 默认头像
 * 使用 bottts 风格，以 username 作为 seed 保证稳定性
 *
 * 运行: npx tsx scripts/seed-avatars.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { avatar: null },
    select: { id: true, username: true },
  })

  console.log(`找到 ${users.length} 个没有头像的用户`)

  if (users.length === 0) {
    console.log('所有用户都已有头像，无需处理')
    return
  }

  let updated = 0
  for (const user of users) {
    const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user.username)}`

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    })

    updated++
    console.log(`[${updated}/${users.length}] ${user.username} -> ${avatarUrl}`)
  }

  console.log(`\n完成！共更新 ${updated} 个用户头像`)
}

main()
  .catch((e) => {
    console.error('脚本执行失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
