# m1_schema_migration — Task Checklist

> Objective: Extend the `Community` Prisma schema with M1 fields per `docs/COMMUNITY_SCHEMA.md`,
> run the migration, write a data-migration script, and verify the build.

---

## Task 1 — Update `prisma/schema.prisma`

**File:** `prisma/schema.prisma`

- [x] Add `transit String?` to the `Community` model (§2 位置信息)
- [x] Add `totalArea String?` to the `Community` model (§3 社区基本情况)
- [x] Add `totalWorkstations Int?` to the `Community` model (§3 社区基本情况)
- [x] Add `focusTracks String[]` to the `Community` model (§3 社区基本情况, default `[]`)
- [x] Add `contactNote String?` to the `Community` model (§4 联系方式)
- [x] Add `benefits Json?` to the `Community` model (§6 五大政策福利)
- [x] Add `entryInfo Json?` to the `Community` model (§5 入驻信息)
- [x] **Do NOT remove** any existing fields: `policies`, `services`, `links`, `suitableFor`, `newSlug`, `workstations`, `focus`, `spaceSize` — these must remain for M2 frontend compatibility

**Acceptance criteria:**
- `npx prisma validate` exits with code 0
- New fields are present in the model; no existing field is removed
- `focusTracks` has `@default([])` so existing rows get an empty array

---

## Task 2 — Run Prisma migration

- [x] Run `npx prisma migrate dev --name add_community_m1_fields`
- [x] Run `npx prisma generate` to regenerate the Prisma client
- [x] Confirm migration file created under `prisma/migrations/`

**Acceptance criteria:**
- Migration exits with code 0 (no errors)
- `prisma/migrations/*_add_community_m1_fields/migration.sql` exists and contains `ALTER TABLE` statements for the 7 new columns
- `npx prisma db pull` (dry-run check) shows no schema drift

---

## Task 3 — Create data-migration script `scripts/migrate_community_m1.ts`

**File:** `scripts/migrate_community_m1.ts`

The script must:

- [x] Import `PrismaClient` from `@/lib/db` (or directly from `@prisma/client` for a standalone script)
- [x] Fetch **all** communities with `prisma.community.findMany()`
- [x] For each community, build an `updateData` object with these field copies:
  - [x] `totalWorkstations` ← `workstations` (if `workstations != null`)
  - [x] `totalArea` ← `spaceSize` (if `spaceSize != null`)
  - [x] `focusTracks` ← `focus` split by comma/whitespace (if `focus != null`), else keep `[]`
  - [x] `slug` ← `newSlug` (if `newSlug != null && newSlug !== ""`)
- [x] Include a **scaffolded** (not yet implemented) function `transformBenefits(community)` that:
  - Returns `null` (no-op for now)
  - Has a `TODO` comment explaining it will use an LLM to convert `policies`/`services` → `benefits` and `entryProcess`/`processTime` → `entryInfo`
- [x] Call `prisma.community.update()` for each community (only set fields where source is non-null)
- [x] Log a summary: `Updated N communities` at the end
- [x] Be runnable via `npx ts-node --project tsconfig.json scripts/migrate_community_m1.ts`

**Acceptance criteria:**
- Script compiles with no TypeScript errors (`npx tsc --noEmit` passes)
- Running the script against the dev DB updates `totalWorkstations`/`totalArea`/`focusTracks`/`slug` for rows that have the source fields populated
- Script is idempotent: running it twice produces the same result (no duplicates, no overwrite of manually entered `focusTracks`)
- `transformBenefits` stub is present and clearly marked `TODO`

---

## Task 4 — Verify build

- [x] Run `npx tsc --noEmit` — must exit with code 0
- [x] Run `npm run build` — must complete without errors (ISR pages pre-render successfully)

**Acceptance criteria:**
- Zero TypeScript errors
- Next.js build succeeds; all 104 community static pages still generate
- No runtime errors on `/communities` or `/communities/[slug]` pages after migration

---

## Notes

- All new nullable fields default to `null`; no existing row is broken by the schema change.
- `focusTracks String[]` must include `@default([])` in the Prisma schema so existing rows receive an empty array instead of null.
- The `focus` field (legacy `String?`) stores a single comma-separated string; split it on `/[，,、\s]+/` when copying to `focusTracks`.
- Do **not** delete or rename `newSlug` in this migration — that happens in M2 once the frontend is updated.
- Keep `benefits` and `entryInfo` as `Json?` (nullable); the LLM-fill pass is a separate M1.5/M2 task.
