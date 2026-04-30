import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const communities = await prisma.community.findMany({
    where: { entryFriendly: { not: null } },
    select: { id: true, name: true, entryFriendly: true }
  })

  console.log(`Found ${communities.length} communities with entryFriendly set`)

  for (const c of communities) {
    const newValue = 6 - c.entryFriendly!
    await prisma.community.update({
      where: { id: c.id },
      data: { entryFriendly: newValue }
    })
    console.log(`  ${c.name}: ${c.entryFriendly} → ${newValue}`)
  }

  console.log('Done reversing entryFriendly values')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
