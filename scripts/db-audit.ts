import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const [
    projectTotal,
    projectByType,
    postTotal,
    postByType,
    commentsOnProject,
    commentsOnPost,
    favsOnProject,
    favsOnPost,
    progressTotal,
    userTotal,
    communityTotal,
    inquiryTotal,
    demandWithComments,
    demandWithFavs,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.groupBy({ by: ['contentType'], _count: true }),
    prisma.post.count(),
    prisma.post.groupBy({ by: ['type'], _count: true }),
    prisma.comment.count({ where: { projectId: { not: null } } }),
    prisma.comment.count({ where: { postId: { not: null } } }),
    prisma.favorite.count({ where: { projectId: { not: null } } }),
    prisma.favorite.count({ where: { postId: { not: null } } }),
    prisma.progress.count(),
    prisma.user.count(),
    prisma.community.count(),
    prisma.inquiry.count(),
    // DEMAND/COOPERATION records that have comments
    prisma.comment.count({ where: { project: { contentType: { in: ['DEMAND', 'COOPERATION'] } } } }),
    prisma.favorite.count({ where: { project: { contentType: { in: ['DEMAND', 'COOPERATION'] } } } }),
  ])

  console.log('=== DB AUDIT ===')
  console.log('\n[Project表]')
  console.log('总数:', projectTotal)
  console.log('按contentType:', projectByType)
  
  console.log('\n[Post表]')
  console.log('总数:', postTotal)
  console.log('按type:', postByType)

  console.log('\n[关联数据]')
  console.log('Comment on Project:', commentsOnProject)
  console.log('Comment on Post:', commentsOnPost)
  console.log('Favorite on Project:', favsOnProject)
  console.log('Favorite on Post:', favsOnPost)
  console.log('Progress总数:', progressTotal)

  console.log('\n[迁移影响评估]')
  console.log('DEMAND/COOPERATION 有Comment:', demandWithComments)
  console.log('DEMAND/COOPERATION 有Favorite:', demandWithFavs)

  console.log('\n[其他表体量]')
  console.log('User:', userTotal)
  console.log('Community:', communityTotal)
  console.log('Inquiry:', inquiryTotal)

  // Project deprecated字段使用情况
  const taglineUsed = await prisma.project.count({ where: { tagline: { not: null } } })
  const projectWithBudget = await prisma.project.count({ where: { budgetMin: { not: null } } })
  const postWithTitle = await prisma.post.count({ where: { title: { not: null } } })
  const postWithProjectId = await prisma.post.count({ where: { projectId: { not: null } } })
  
  console.log('\n[废弃/混用字段]')
  console.log('Project.tagline 有值:', taglineUsed, '(@deprecated)')
  console.log('Project.budgetMin 有值 (DEMAND类型混入):', projectWithBudget)
  console.log('Post.title 有值:', postWithTitle)
  console.log('Post.projectId 有值 (关联产品):', postWithProjectId)
}

main().catch(console.error).finally(() => prisma.$disconnect())
