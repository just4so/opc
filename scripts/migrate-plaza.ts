/**
 * One-time migration: plaza-to-corner consolidation
 * 1. Remap old PostType values: DAILY/DISCUSSION→CHAT, QUESTION→HELP, EXPERIENCE/RESOURCE→SHARE
 * 2. Migrate Project records (DEMAND/COOPERATION) → Post table with type=COLLAB
 *
 * ⚠️  DO NOT RUN until production is ready. Confirm with the team first.
 * Usage: npm run migrate-plaza
 */
import prisma from '../lib/db'

async function stripHtml(html: string): Promise<string> {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function main() {
  // ──────────────────────────────────────────────
  // Pre-migration counts
  // ──────────────────────────────────────────────
  console.log('=== Pre-migration counts ===')
  const preCounts = await Promise.all([
    prisma.post.count({ where: { type: 'DAILY' } }),
    prisma.post.count({ where: { type: 'EXPERIENCE' } }),
    prisma.post.count({ where: { type: 'QUESTION' } }),
    prisma.post.count({ where: { type: 'RESOURCE' } }),
    prisma.post.count({ where: { type: 'DISCUSSION' } }),
    prisma.project.count({ where: { contentType: { in: ['DEMAND', 'COOPERATION'] } } }),
  ])
  console.log(`DAILY:       ${preCounts[0]}`)
  console.log(`EXPERIENCE:  ${preCounts[1]}`)
  console.log(`QUESTION:    ${preCounts[2]}`)
  console.log(`RESOURCE:    ${preCounts[3]}`)
  console.log(`DISCUSSION:  ${preCounts[4]}`)
  console.log(`Projects (DEMAND+COOPERATION): ${preCounts[5]}`)
  console.log()

  await prisma.$transaction(async (tx) => {
    // ──────────────────────────────────────────────
    // Step 1: Remap old PostType values
    // ──────────────────────────────────────────────
    console.log('=== Step 1: Remapping PostType values ===')

    const [daily, discussion, question, experience, resource] = await Promise.all([
      tx.post.updateMany({ where: { type: 'DAILY' },      data: { type: 'CHAT' } }),
      tx.post.updateMany({ where: { type: 'DISCUSSION' }, data: { type: 'CHAT' } }),
      tx.post.updateMany({ where: { type: 'QUESTION' },   data: { type: 'HELP' } }),
      tx.post.updateMany({ where: { type: 'EXPERIENCE' }, data: { type: 'SHARE' } }),
      tx.post.updateMany({ where: { type: 'RESOURCE' },   data: { type: 'SHARE' } }),
    ])
    console.log(`DAILY      → CHAT:  ${daily.count} posts`)
    console.log(`DISCUSSION → CHAT:  ${discussion.count} posts`)
    console.log(`QUESTION   → HELP:  ${question.count} posts`)
    console.log(`EXPERIENCE → SHARE: ${experience.count} posts`)
    console.log(`RESOURCE   → SHARE: ${resource.count} posts`)
    console.log()

    // ──────────────────────────────────────────────
    // Step 2: Migrate Project (DEMAND/COOPERATION) → Post
    // ──────────────────────────────────────────────
    console.log('=== Step 2: Migrating Project records to Post ===')

    const projects = await tx.project.findMany({
      where: {
        contentType: { in: ['DEMAND', 'COOPERATION'] },
        status: 'PUBLISHED',
      },
    })

    console.log(`Found ${projects.length} projects to migrate`)

    let migrated = 0
    for (const proj of projects) {
      const plainContent = await stripHtml(proj.description)
      await tx.post.create({
        data: {
          title: proj.name,
          content: plainContent,
          contentHtml: null,
          type: 'COLLAB',
          topics: proj.category,
          authorId: proj.ownerId,
          budgetMin: proj.budgetMin,
          budgetMax: proj.budgetMax,
          budgetType: proj.budgetType,
          deadline: proj.deadline,
          skills: proj.skills,
          contactInfo: proj.contactInfo,
          contactType: proj.contactType,
          likeCount: proj.likeCount,
          commentCount: proj.commentCount,
          viewCount: proj.viewCount,
          createdAt: proj.createdAt,
        },
      })
      migrated++
    }
    console.log(`Migrated ${migrated} projects to Post(COLLAB)`)
  })

  // ──────────────────────────────────────────────
  // Post-migration counts
  // ──────────────────────────────────────────────
  console.log()
  console.log('=== Post-migration counts ===')
  const postCounts = await Promise.all([
    prisma.post.count({ where: { type: 'CHAT' } }),
    prisma.post.count({ where: { type: 'HELP' } }),
    prisma.post.count({ where: { type: 'SHARE' } }),
    prisma.post.count({ where: { type: 'COLLAB' } }),
  ])
  console.log(`CHAT:   ${postCounts[0]}`)
  console.log(`HELP:   ${postCounts[1]}`)
  console.log(`SHARE:  ${postCounts[2]}`)
  console.log(`COLLAB: ${postCounts[3]}`)
  console.log()

  const totalPre = preCounts[0] + preCounts[1] + preCounts[2] + preCounts[3] + preCounts[4]
  const totalPost = postCounts[0] + postCounts[1] + postCounts[2] + postCounts[3]
  const expectedIncrease = preCounts[5]
  const actualIncrease = totalPost - totalPre
  console.log(`Post count increase: ${actualIncrease} (expected: ${expectedIncrease})`)
  if (actualIncrease === expectedIncrease) {
    console.log('✅ Migration validated successfully')
  } else {
    console.error('❌ Migration count mismatch - please investigate')
    process.exit(1)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
