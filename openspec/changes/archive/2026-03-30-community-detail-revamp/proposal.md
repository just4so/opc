## Why

The community detail page and admin form have grown organically, resulting in scattered information architecture, poor reading experience, and difficult data maintenance. Specifically:

1. **User reading experience**: All sections are equal-weight cards with no information hierarchy. Users cannot quickly judge "is this community worth applying to" because key decision-making data (policies, difficulty, real tips) is buried under generic content.

2. **Data structure chaos**: Fields were added reactively without classification. `notes` and `realTips` overlap semantically. `slug`/`newSlug` dual-field requires `newSlug || slug` fallback logic everywhere. No TypeScript types enforce the `policies` JSON structure.

3. **Admin form disorganization**: The 6-section layout doesn't reflect data purpose — `description` and `address` share "Basic Info", while `spaceSize`/`workstations` are in "Operations". The `policies` field is a raw JSON textarea with no structure guidance.

4. **Missing cache invalidation**: After admin saves a community, the ISR cache (1hr) is never explicitly invalidated, causing stale content for up to 1 hour.

## What Changes

### 1. Community Detail Page — Three-Layer Information Architecture

Restructure `/app/(main)/communities/[slug]/page.tsx` to reflect user decision flow:

**Layer 1 — Quick Judgment (visible without login, above the fold)**
- Hero section: cover image (if available), community name, city/district, type badge, featured badge
- 3 stat chips: workstations count / space size / apply difficulty stars
- Suitable-for tags (compact tag list)
- First sentence of description as tagline

**Layer 2 — Deep Dive (login required, core conversion zone)**
Main column order (revised):
1. 🎁 Entry Policies (`policies`) — most valuable, shown first
2. 📋 Entry Process (`entryProcess`) — numbered steps
3. 🔍 Real Intel (`realTips`) — visually distinct, OPC's differentiator
4. ⚙️ Supporting Services (`services`)

Sidebar:
- CTA card (register prompt or bookmark button)
- Map + address
- Contact info

**Layer 3 — Reference (end of page, supplementary)**
- Full description (Markdown rendered)
- Notes (migrated into realTips — see below)
- Reference links
- Community reviews

### 2. Description Field — Markdown Support

- Storage: `description` remains `String` in DB — no schema change needed. Markdown is backward-compatible with plain text.
- Admin form: replace `<textarea>` with `@uiw/react-md-editor` (split-pane editor with preview)
- Frontend display: replace `whitespace-pre-line` with `react-markdown` + `remark-gfm` rendering

### 3. Admin Form — 5-Section Restructure

Replace current 6-section layout with semantically clean 5 sections:

| Section | Fields |
|---------|--------|
| **A. Identity** | name, slug, city, district, type, focus (tags), suitableFor (tags), status, featured |
| **B. Location & Space** | address, latitude/longitude (map picker), spaceSize, workstations |
| **C. Contact & Media** | operator, contactName, contactWechat, contactPhone, website, coverImage, images, links |
| **D. Benefits & Process** | policies (structured sub-form), services (TagInput), entryProcess (ArrayInput) |
| **E. Real Intel** | description (Markdown editor), realTips (ArrayInput — replaces both old realTips + notes), applyDifficulty (star rating), processTime, lastVerifiedAt |

### 4. Data Cleanup — `notes` Deprecation

- Write a one-time migration script (`scripts/migrate-notes.ts`) that appends each community's `notes[]` content into its `realTips[]` array, deduplicating exact matches
- After migration, remove `notes` from Prisma schema
- Remove all `notes` references from frontend and admin form
- The front-end detail page only renders `realTips` going forward

### 5. Slug Field Cleanup — Eliminate `newSlug || slug` Pattern

- `newSlug` is now the canonical URL identifier (all existing communities have it set from the previous slug migration)
- Replace all `community.newSlug || community.slug` occurrences with `community.newSlug ?? community.slug` as a safe fallback, but add a runtime warning log when `newSlug` is null
- In `getCommunity()` lookup function, keep the OR query for backward compatibility (existing bookmarks/links using old slugs still work)
- Document in schema comment that `slug` is legacy/read-only and `newSlug` is canonical

### 6. Policies JSON — TypeScript Type Enforcement

Define a `CommunityPolicies` TypeScript interface in `lib/types/community.ts`:

```typescript
interface CommunityPolicies {
  spaceSubsidy?: Record<string, string>      // 空间补贴: key=类型, value=金额/描述
  coreBenefits?: Record<string, string>      // 核心福利
  computeSubsidy?: string[]                  // 算力补贴条目
  vouchers?: Record<string, string>          // 政策券
  comprehensive?: string[]                   // 综合政策
  support?: string[]                         // 配套政策标签
}
```

- Cast `policies` as `CommunityPolicies` in the detail page and admin form
- Admin form Section D: render each sub-key as a dedicated input area (key-value pairs UI for Record types, ArrayInput for string[] types) instead of raw JSON textarea
- DB field remains `Json?` — zero migration cost

### 7. Cache Invalidation — `revalidatePath` on Save

In `/app/api/admin/communities/[id]/route.ts` PATCH handler, after successful DB update:

```typescript
import { revalidatePath } from 'next/cache'
revalidatePath('/communities')
revalidatePath(`/communities/${updated.newSlug ?? updated.slug}`)
```

Also add to the POST (create) handler in `/app/api/admin/communities/route.ts`:
```typescript
revalidatePath('/communities')
```

## Capabilities

### New Capabilities
- `community-markdown-description`: Render and edit community descriptions as Markdown
- `community-policies-typed-form`: Structured admin form for policies JSON with typed sub-sections
- `community-cache-invalidation`: Explicit ISR cache invalidation on admin save/create

### Modified Capabilities
- `community-detail-layout`: Three-layer information architecture replacing flat card layout
- `community-admin-form`: 5-section restructured form replacing 6-section layout
- `community-real-intel`: `realTips` consolidates both old `realTips` and `notes` fields
- `community-slug-resolution`: `newSlug` as canonical identifier, `slug` as legacy fallback only

### Removed Capabilities
- `community-notes-field`: `notes[]` field removed after migration into `realTips`

## Impact

- **Database**: Remove `notes` field from `Community` model (requires migration). No other schema changes.
- **Prisma schema**: `prisma/schema.prisma` — remove `notes String[]`
- **Migration script**: New `scripts/migrate-notes.ts` — one-time run before deploying
- **New types file**: `lib/types/community.ts` — CommunityPolicies interface
- **New dependency**: `@uiw/react-md-editor` (admin only), `react-markdown`, `remark-gfm` (frontend)
- **Modified files**:
  - `app/(main)/communities/[slug]/page.tsx` — full layout restructure
  - `app/admin/communities/community-form.tsx` — 5-section restructure + policies sub-form + MD editor
  - `app/api/admin/communities/[id]/route.ts` — add revalidatePath
  - `app/api/admin/communities/route.ts` — add revalidatePath
  - All files with `community.notes` references — remove
  - All files with `newSlug || slug` pattern — clean up
- **SEO**: No URL changes. ISR cache now invalidated immediately on admin save.
- **Data safety**: `notes` migration script must run and be verified BEFORE deploying the build that removes the field.
