import prisma from '../lib/db'
import { generateUniqueSlug } from '../lib/slug'

async function main() {
  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, city: true, slug: true },
    orderBy: { createdAt: 'asc' },
  })

  const existingSlugs: string[] = []
  let updated = 0

  for (const community of communities) {
    const newSlug = generateUniqueSlug(community.city, community.name, existingSlugs)
    existingSlugs.push(newSlug)

    await prisma.community.update({
      where: { id: community.id },
      data: { newSlug },
    })

    updated += 1
    console.log(`${community.name} -> ${newSlug}`)
  }

  console.log(`Done. Updated ${updated} communities.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
