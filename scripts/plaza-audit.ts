import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 有产品但 showInPlaza=false 的用户
  const hidden = await prisma.user.findMany({
    where: {
      showInPlaza: false,
      projects: { some: { status: 'PUBLISHED', contentType: 'PROJECT' } }
    },
    select: {
      id: true, name: true, email: true, createdAt: true, bio: true, updatedAt: true,
      _count: { select: { projects: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
  console.log('showInPlaza=false 但有产品的用户: ' + hidden.length + ' 人')
  hidden.forEach(u => {
    const hasBio = u.bio ? '有bio' : '无bio'
    const recent = u.updatedAt > new Date('2026-01-01') ? '2026年活跃' : '久未活跃'
    console.log('  ' + u.name + ' | ' + hasBio + ' | ' + recent + ' | 产品:' + u._count.projects + ' | 注册:' + u.createdAt.toISOString().slice(0,10))
  })

  // 广场开关总体统计
  const plazaOn = await prisma.user.count({ where: { showInPlaza: true } })
  const total = await prisma.user.count()
  console.log('\nshowInPlaza=true: ' + plazaOn + ' / ' + total + ' (' + (plazaOn/total*100).toFixed(1) + '%)')

  // showInPlaza=true 里有多少是种子数据（系统导入的）
  const seedUsers = await prisma.user.count({
    where: { showInPlaza: false, email: { contains: 'seed' } }
  })
  console.log('疑似种子用户(email含seed): ' + seedUsers)

  // showInPlaza=false 的用户里有没有设置 bio
  const withBio = await prisma.user.count({
    where: {
      showInPlaza: false,
      projects: { some: { status: 'PUBLISHED', contentType: 'PROJECT' } },
      bio: { not: null }
    }
  })
  console.log('有产品且有bio但隐藏: ' + withBio)

  // 2026年后有更新活动的
  const recentActive = await prisma.user.count({
    where: {
      showInPlaza: false,
      projects: { some: { status: 'PUBLISHED', contentType: 'PROJECT' } },
      updatedAt: { gte: new Date('2026-01-01') }
    }
  })
  console.log('2026年后有活动: ' + recentActive)

  // showInPlaza=true 的用户是怎么来的（注册时间分布）
  const plazaOnUsers = await prisma.user.findMany({
    where: { showInPlaza: true },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  })
  if (plazaOnUsers.length > 0) {
    console.log('\nshowInPlaza=true 用户注册时间范围: ' + plazaOnUsers[0].createdAt.toISOString().slice(0,10) + ' ~ ' + plazaOnUsers[plazaOnUsers.length-1].createdAt.toISOString().slice(0,10))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
