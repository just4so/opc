import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCounts() {
  console.log('开始修正计数字段...')

  const posts = await prisma.post.findMany({
    include: {
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    }
  })

  let fixed = 0
  for (const post of posts) {
    const actualLikes = post._count.likes
    const actualComments = post._count.comments

    if (post.likeCount !== actualLikes || post.commentCount !== actualComments) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          likeCount: actualLikes,
          commentCount: actualComments
        }
      })
      fixed++
      console.log(`修正 Post#${post.id}: likes ${post.likeCount}->${actualLikes}, comments ${post.commentCount}->${actualComments}`)
    }
  }

  console.log(`✅ 修正完成，共修正 ${fixed} 条记录`)
  await prisma.$disconnect()
}

fixCounts().catch(console.error)
