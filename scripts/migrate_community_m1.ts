/**
 * Data migration script: M1 schema migration
 *
 * Copies legacy fields to new M1 fields:
 *   workstations  → totalWorkstations
 *   spaceSize     → totalArea
 *   focus[]       → focusTracks (split on separators)
 *   newSlug       → slug (if non-empty)
 *
 * Run: npx ts-node --project tsconfig.json scripts/migrate_community_m1.ts
 *
 * Idempotent: running it twice produces the same result.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * TODO: Implement LLM-based transformation for benefits and entryInfo.
 *
 * This function should convert legacy fields into structured M1 fields:
 *   - `policies` / `services` → `benefits` (Json: { office, compute, business, funding, housing })
 *   - `entryProcess[]` / `processTime` → `entryInfo` (Json: { requirements, steps, duration })
 *
 * For now returns null (no-op) so existing rows are not affected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformBenefits(_community: any): null {
  // TODO: call an LLM to convert policies/services → benefits and
  //       entryProcess/processTime → entryInfo once the prompt is ready.
  return null
}

async function main() {
  const communities = await prisma.community.findMany()

  let updated = 0

  for (const community of communities) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}

    // Copy workstations → totalWorkstations (only if source is set and target not already set)
    if (community.workstations != null && community.totalWorkstations == null) {
      data.totalWorkstations = community.workstations
    }

    // Copy spaceSize → totalArea (only if source is set and target not already set)
    if (community.spaceSize != null && community.totalArea == null) {
      data.totalArea = community.spaceSize
    }

    // Copy focus[] → focusTracks (only if target is still empty)
    if (community.focusTracks.length === 0 && community.focus.length > 0) {
      // Legacy data may store comma-separated values inside array elements;
      // join then re-split to normalise.
      const joined = community.focus.join('，')
      const tracks = joined
        .split(/[，,、\s]+/)
        .map((t: string) => t.trim())
        .filter(Boolean)
      if (tracks.length > 0) {
        data.focusTracks = tracks
      }
    }

    // Copy newSlug → slug (only if newSlug is non-empty)
    if (community.newSlug && community.newSlug !== '') {
      data.slug = community.newSlug
    }

    // Stub: benefits / entryInfo transformation (no-op for now)
    transformBenefits(community)

    if (Object.keys(data).length > 0) {
      await prisma.community.update({
        where: { id: community.id },
        data,
      })
      updated++
    }
  }

  console.log(`Updated ${updated} communities`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
