/**
 * One-time migration: append community.notes[] into community.realTips[], deduplicating exact matches.
 * Run BEFORE removing `notes` field from Prisma schema.
 *
 * Usage: npx tsx scripts/migrate-notes.ts
 */
import prisma from '../lib/db'

async function main() {
  const communities = await prisma.community.findMany({
    select: { id: true, name: true, notes: true, realTips: true },
  })

  let migrated = 0
  let skipped = 0

  for (const community of communities) {
    if (community.notes.length === 0) {
      skipped++
      continue
    }

    const existing = new Set(community.realTips)
    const toAdd = community.notes.filter((note) => !existing.has(note))

    if (toAdd.length === 0) {
      console.log(`[skip] ${community.name}: all notes already in realTips`)
      skipped++
      continue
    }

    const updatedRealTips = [...community.realTips, ...toAdd]
    await prisma.community.update({
      where: { id: community.id },
      data: { realTips: updatedRealTips },
    })

    console.log(`[ok] ${community.name}: added ${toAdd.length} notes → realTips (${updatedRealTips.length} total)`)
    migrated++
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
