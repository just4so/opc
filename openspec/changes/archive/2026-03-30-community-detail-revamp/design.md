## Context

The community detail page and admin form have grown organically. Current state:
- Flat card layout with no information hierarchy — users must scroll through everything to find decision-relevant data (policies, difficulty, real tips)
- `notes` and `realTips` overlap semantically; both exist in DB and admin form
- `newSlug || slug` fallback pattern scattered across the codebase (both are present on all community objects)
- `policies` is stored as `Json?` in DB and edited as a raw JSON textarea in admin — no type safety, poor UX
- ISR cache (1hr TTL) is never invalidated after admin saves, causing stale content

Tech stack constraints: Next.js 14 App Router, Prisma 5, ISR rendering for community pages, admin form is a client component with server actions via API routes.

## Goals / Non-Goals

**Goals:**
- Three-layer information architecture on the detail page reflecting user decision flow
- Markdown support for `description` field (admin editor + frontend renderer)
- 5-section admin form reorganization with structured policies sub-form
- Migrate `notes[]` into `realTips[]`, then remove `notes` from schema
- Define `CommunityPolicies` TypeScript interface; cast `policies` field throughout
- Clean up `newSlug || slug` pattern — `newSlug` as canonical, `slug` as legacy fallback
- `revalidatePath` on admin save/create for immediate ISR cache invalidation

**Non-Goals:**
- No URL changes (existing bookmarks remain valid)
- No changes to community map, Baidu Maps integration, or review system
- No changes to other pages that list communities (the communities list page)
- No real-time data or WebSocket — ISR + on-demand revalidation is sufficient
- Not implementing full CMS for policies — structured sub-form is sufficient

## Decisions

### D1: Markdown for `description` — no DB schema change
**Decision**: Store Markdown in the existing `String` field; add `@uiw/react-md-editor` for admin, `react-markdown` + `remark-gfm` for frontend display.
**Rationale**: Plain text is valid Markdown (backward-compatible). Adding a new field or migration would be unnecessary. The project already uses `react-markdown` + `remark-gfm` for plaza and news — consistent pattern.
**Alternative considered**: Separate `descriptionMd` field — rejected because it doubles storage and requires a non-trivial migration.

### D2: `notes` migration — script-first, then schema removal
**Decision**: Write `scripts/migrate-notes.ts` that appends `notes[]` into `realTips[]` (deduplicating exact matches), run it manually before deployment, then remove `notes` from Prisma schema.
**Rationale**: Zero data loss. The migration script is idempotent (dedup prevents duplicates if run twice). Removes the need to keep both fields in sync going forward.
**Risk**: If schema removal deploys before the script runs, `notes` data is lost on next `prisma migrate`. Mitigation: document deploy order; keep `notes` in schema until script is confirmed run.

### D3: `policies` TypeScript interface — no DB change
**Decision**: Define `CommunityPolicies` interface in `lib/types/community.ts`; cast at usage sites. DB field stays `Json?`.
**Rationale**: Adding type safety is purely a TypeScript concern. The DB can hold any JSON; we enforce shape at the application layer. Avoids a non-trivial migration.
**Admin form approach**: Render each `CommunityPolicies` key as a dedicated input component (key-value pairs for `Record<string, string>`, `ArrayInput` for `string[]`) rather than a raw textarea.

### D4: Slug canonical resolution — `newSlug` wins, keep OR query for lookup
**Decision**: Replace `community.newSlug || community.slug` with `community.newSlug ?? community.slug` (functionally identical but semantically clearer). Keep the `WHERE slug = X OR newSlug = X` query in `getCommunity()` so old bookmarked URLs still resolve. Add a `console.warn` when `newSlug` is null.
**Rationale**: All 104 existing communities already have `newSlug` set. The `??` change is cosmetic but documents intent. The OR query is the safety net for any edge cases.

### D5: ISR cache invalidation — `revalidatePath` in API route handlers
**Decision**: Call `revalidatePath('/communities')` and `revalidatePath('/communities/[slug]')` in the PATCH and POST handlers of the admin communities API routes.
**Rationale**: Next.js 14 on-demand revalidation is the standard pattern. No additional infrastructure needed (no Redis, no CDN purge API). Works with Supabase/Vercel deployment.

### D6: Three-layer detail page — single page component, login gate on Layer 2
**Decision**: Implement all three layers in the existing `app/(main)/communities/[slug]/page.tsx`. Layer 2 content is conditionally rendered based on session (existing pattern used elsewhere in the codebase).
**Rationale**: Keeps ISR `generateStaticParams` working. Layer 2 rendered server-side for logged-in users (no client-side fetch needed for content). SEO gets Layer 1 content in the static HTML.

## Risks / Trade-offs

- **`@uiw/react-md-editor` bundle size**: ~150KB gzipped, admin-only. Acceptable since admin is not performance-critical and is not statically generated.
  → Mitigation: Import with `dynamic(() => import(...), { ssr: false })` to avoid SSR issues with the editor.

- **Policies sub-form complexity**: The `CommunityPolicies` interface has mixed types (Record vs string[]). Rendering each key type as a different input adds form complexity.
  → Mitigation: Build reusable `KeyValueInput` and `ArrayInput` components. If complexity becomes unmanageable, fall back to a structured JSON textarea with schema hint.

- **`notes` migration data loss if deploy order is wrong**: If the code removing `notes` deploys before the migration script runs, Prisma will remove the column on next migrate.
  → Mitigation: Keep `notes` in schema until migration is confirmed. Use a deploy checklist comment in the PR.

- **Layer 2 login gate UX**: Users without an account see a truncated page. This is intentional (conversion mechanic) but may frustrate legitimate users.
  → Accepted trade-off per existing product strategy.

## Migration Plan

1. Run `scripts/migrate-notes.ts` against production DB (verify output before committing)
2. Confirm no community has non-empty `notes` that wasn't migrated
3. Deploy the build (which removes `notes` from schema and all code references)
4. Run `npx prisma db push` in production to remove the `notes` column
5. Rollback: if issues arise before step 4, redeploy previous build — DB still has `notes` column intact

## Open Questions

- Should the Markdown editor in admin show a "preview" tab by default or "edit" tab? → Default to split-pane (edit + preview side by side) for discoverability.
- Should `realTips` in the detail page be gated behind login (Layer 2) or always visible (Layer 1)? → Layer 2 (login-gated) per the proposal — it's OPC's core differentiator and a conversion driver.
