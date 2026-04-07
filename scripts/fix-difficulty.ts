import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const communities = await prisma.community.findMany({
    where: { applyDifficulty: { not: null } },
    select: { id: true, name: true, applyDifficulty: true }
  })

  console.log(`Found ${communities.length} communities with applyDifficulty set`)

  for (const c of communities) {
    const newValue = 6 - c.applyDifficulty!
    await prisma.community.update({
      where: { id: c.id },
      data: { applyDifficulty: newValue }
    })
    console.log(`  ${c.name}: ${c.applyDifficulty} → ${newValue}`)
  }

  console.log('Done reversing applyDifficulty values')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
