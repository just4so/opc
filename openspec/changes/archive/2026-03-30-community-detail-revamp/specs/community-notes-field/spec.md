## REMOVED Requirements

### Requirement: Community notes field stores supplementary tips
**Reason**: `notes[]` semantically overlaps with `realTips[]`. After migration, all content is consolidated into `realTips[]` for a single source of truth. The field is removed to eliminate ambiguity for admins and simplify the data model.
**Migration**: Run `scripts/migrate-notes.ts` to append all `notes[]` entries into `realTips[]` (with deduplication) before deploying the build that removes the field. After migration, remove `notes` from `prisma/schema.prisma` and run `npm run db:push`.
