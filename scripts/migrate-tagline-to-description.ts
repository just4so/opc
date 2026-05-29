import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Migrate tagline to description ===\n')

  const projects = await prisma.project.findMany({
    where: {
      tagline: { not: null },
    },
    select: { id: true, tagline: true, description: true },
  })

  let migrated = 0
  let skipped = 0

  for (const project of projects) {
    const tagline = (project.tagline || '').trim()
    if (!tagline) {
      skipped++
      continue
    }

    const desc = (project.description || '').trim()

    // If description is empty or very short, prepend tagline
    if (!desc || desc.length < 50) {
      const newDescription = desc ? `${tagline}\n\n${desc}` : tagline
      await prisma.project.update({
        where: { id: project.id },
        data: { description: newDescription },
      })
      migrated++
    } else {
      // Description already rich enough, skip
      skipped++
    }
  }

  console.log(`Total projects with tagline: ${projects.length}`)
  console.log(`Migrated: ${migrated}`)
  console.log(`Skipped: ${skipped}`)
  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
