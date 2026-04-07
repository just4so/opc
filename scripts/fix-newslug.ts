import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE', newSlug: null },
    select: { id: true, name: true, slug: true }
  })

  console.log(`Found ${communities.length} ACTIVE communities with missing newSlug`)

  for (const c of communities) {
    let candidate = c.slug
    const exists = await prisma.community.findFirst({
      where: { newSlug: candidate, id: { not: c.id } }
    })
    if (exists) candidate = candidate + '-2'
    await prisma.community.update({
      where: { id: c.id },
      data: { newSlug: candidate }
    })
    console.log(`  Fixed: ${c.name} → ${candidate}`)
  }

  console.log('Done filling newSlug')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
