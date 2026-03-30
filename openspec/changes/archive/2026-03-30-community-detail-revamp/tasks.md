## 1. Prerequisites & Dependencies

- [x] 1.1 Install `@uiw/react-md-editor` package (admin Markdown editor)
- [x] 1.2 Verify `react-markdown` and `remark-gfm` are already installed (used in plaza/news); install if missing
- [x] 1.3 Create `lib/types/community.ts` with `CommunityPolicies` interface (all keys optional)

## 2. Data Migration — notes → realTips

- [x] 2.1 Write `scripts/migrate-notes.ts`: for each community with non-empty `notes[]`, append entries to `realTips[]` deduplicating exact matches, log output
- [ ] 2.2 Run migration script against production DB and verify output (manual step — document in PR)
- [x] 2.3 Remove `notes String[]` from `prisma/schema.prisma`
- [ ] 2.4 Run `npm run db:push` and `npm run db:generate` to apply schema change

## 3. Slug & Type Cleanup

- [x] 3.1 Replace all `community.newSlug || community.slug` occurrences with `community.newSlug ?? community.slug` in: `app/(main)/communities/[slug]/page.tsx`, `app/(main)/search/page.tsx`, `components/communities/baidu-map.tsx`, `components/communities/community-card.tsx`
- [x] 3.2 Add `console.warn` log in `getCommunity()` (or wherever slug is resolved) when `newSlug` is null
- [x] 3.3 Confirm `getCommunity()` lookup uses `OR (slug = X, newSlug = X)` query — add if missing
- [x] 3.4 Cast `community.policies` as `CommunityPolicies` in the detail page and admin form (replace `as any` casts)

## 4. Admin Form — 5-Section Restructure

- [x] 4.1 Open `app/admin/communities/community-form.tsx` and audit current section structure
- [x] 4.2 Reorganize form into 5 sections (A: Identity, B: Location & Space, C: Contact & Media, D: Benefits & Process, E: Real Intel) per spec
- [x] 4.3 Remove `notes` field from the admin form
- [x] 4.4 Move `description` field into Section E (Real Intel) and replace `<textarea>` with `@uiw/react-md-editor` (dynamic import, `ssr: false`)
- [x] 4.5 Build `KeyValueInput` component (or inline) for `Record<string, string>` policy fields (`spaceSubsidy`, `coreBenefits`, `vouchers`)
- [x] 4.6 Wire `ArrayInput` (existing or new) for `string[]` policy fields (`computeSubsidy`, `comprehensive`, `support`)
- [x] 4.7 Integrate structured policies sub-form into Section D, replacing raw JSON textarea
- [x] 4.8 Ensure policies sub-form initializes to empty object when `policies` is null

## 5. Community Detail Page — Three-Layer Layout

- [x] 5.1 Open `app/(main)/communities/[slug]/page.tsx` and audit current layout/sections
- [x] 5.2 Implement Layer 1 hero section: cover image, name, city/district, type badge, featured badge, stat chips (workstations / spaceSize / difficulty stars), suitableFor tags, first-sentence tagline from description
- [x] 5.3 Implement Layer 2 login gate: show login/register CTA for guests; show full Layer 2 content for authenticated users
- [x] 5.4 Implement Layer 2 main column in order: policies → entryProcess (numbered) → realTips (callout cards) → services (tags)
- [x] 5.5 Implement Layer 2 sidebar: CTA card (guest prompt / bookmark), map + address, contact info
- [x] 5.6 Implement Layer 3: full description rendered with `react-markdown` + `remark-gfm` in `prose` wrapper, reference links, community reviews
- [x] 5.7 Remove any remaining `notes` rendering from the detail page
- [x] 5.8 Remove `whitespace-pre-line` CSS from description rendering

## 6. Cache Invalidation

- [x] 6.1 Add `revalidatePath('/communities')` and `revalidatePath('/communities/<slug>')` to the `PATCH` handler in `app/api/admin/communities/[id]/route.ts` (after successful DB update, using `updated.newSlug ?? updated.slug`)
- [x] 6.2 Add `revalidatePath('/communities')` to the `POST` handler in `app/api/admin/communities/route.ts` (after successful DB insert)

## 7. Cleanup & Verification

- [x] 7.1 Search codebase for remaining `community.notes` references — remove all
- [x] 7.2 Search codebase for `newSlug || slug` pattern — confirm none remain
- [x] 7.3 Run `npm run build` and fix any TypeScript or build errors
- [ ] 7.4 Manually test community detail page as guest and logged-in user
- [ ] 7.5 Manually test admin form: create community, edit community, verify all 5 sections render correctly
- [ ] 7.6 Verify admin save triggers ISR revalidation (check page freshness after save)
