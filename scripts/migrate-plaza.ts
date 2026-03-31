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

  // Step 1: Remap old PostType values（独立事务，快）
  await prisma.$transaction([
    prisma.post.updateMany({ where: { type: 'DAILY' },      data: { type: 'CHAT' } }),
    prisma.post.updateMany({ where: { type: 'DISCUSSION' }, data: { type: 'CHAT' } }),
    prisma.post.updateMany({ where: { type: 'QUESTION' },   data: { type: 'HELP' } }),
    prisma.post.updateMany({ where: { type: 'EXPERIENCE' }, data: { type: 'SHARE' } }),
    prisma.post.updateMany({ where: { type: 'RESOURCE' },   data: { type: 'SHARE' } }),
  ])
  console.log(`DAILY/DISCUSSION → CHAT, QUESTION → HELP, EXPERIENCE/RESOURCE → SHARE`)
  console.log()

    // ──────────────────────────────────────────────
    // Step 2: Migrate Project (DEMAND/COOPERATION) → Post
    // ──────────────────────────────────────────────
    console.log('=== Step 2: Migrating Project records to Post ===')

    const projects = await prisma.project.findMany({
      where: {
        contentType: { in: ['DEMAND', 'COOPERATION'] },
        status: 'PUBLISHED',
      },
    })

    console.log(`Found ${projects.length} projects to migrate`)

    const newPosts = await Promise.all(projects.map(async (proj) => {
      const plainContent = await stripHtml(proj.description)
      return {
        title: proj.name,
        content: plainContent,
        contentHtml: null as null,
        type: 'COLLAB' as const,
        topics: Array.isArray(proj.category) ? proj.category as string[] : (proj.category ? [proj.category as string] : []),
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
      }
    }))

    // 批量插入，单次事务不超时
    const result = await prisma.post.createMany({ data: newPosts })
    console.log(`Migrated ${result.count} projects to Post(COLLAB)`)

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
