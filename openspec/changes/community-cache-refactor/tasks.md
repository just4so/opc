# community-cache-refactor — Task Checklist

## M1: Detail Page ISR Refactor

### 1. Private API Route

- [ ] 1.1 Create `app/api/community/[slug]/private/route.ts`
  - GET handler: call `auth()`, return 401 if not logged in
  - Query community by slug (OR newSlug) — select: entryInfo, realTips, images, amenities, contactName, contactPhone, contactWechat, contactNote
  - Compute `unlocked = (await prisma.inquiry.count({ where: { userId } })) > 0`
  - If `!unlocked`: set contactPhone/contactWechat to null before returning
  - Return JSON: `{ entryInfo, realTips, images, amenities, contactName, contactPhone, contactWechat, contactNote, unlocked }`
  - **Acceptance:** `curl -s http://localhost:3000/api/community/some-slug/private` returns 401; with valid session cookie returns JSON with correct shape

### 2. CommunityPrivateContent Client Component

- [ ] 2.1 Create `components/communities/community-private-content.tsx` (`'use client'`)
  - Props: `{ slug: string }`
  - Uses `useSession()` — if status === 'loading': render null (avoid hydration flicker)
  - Uses `useSession()` — if no session: render "登录后查看完整入驻信息" card with login link
  - If session present: fetch `/api/community/${slug}/private` on mount, show loading skeleton matching the real content layout shape
  - Renders: entryInfo section, realTips callout cards, amenities tags, images grid
  - At bottom: render `<ContactUnlock>` passing all fetched contact fields + unlocked status as props (ContactUnlock remains a separate component, retains the "社区直通车" button)
  - **Acceptance:** Component renders login gate when logged out; fetches and renders private data when logged in

### 3. ContactUnlock Refactor

- [ ] 3.1 Modify `components/connect/contact-unlock.tsx`
  - Remove props: `contactPhone`, `contactWechat`, `contactName`, `contactNote`
  - Remove internal `/api/inquiries` fetch
  - Add props (passed from CommunityPrivateContent): `slug: string`, `unlocked: boolean`, `contactName: string | null`, `contactPhone: string | null`, `contactWechat: string | null`, `contactNote: string | null`
  - ContactUnlock stays as independent component: renders contact info UI + "社区直通车" button (existing behavior preserved)
  - **Acceptance:** `grep -n "fetch.*inquiries" components/connect/contact-unlock.tsx` returns no matches; `grep -r "contactPhone\|contactWechat" app/\(main\)/communities/\[slug\]/page.tsx` returns no matches (server page no longer holds these values)

### 4. MobileRegisterBar Refactor

- [ ] 4.1 Modify `components/layout/mobile-register-bar.tsx`
  - Remove `isLoggedIn` prop
  - Add `'use client'` directive
  - Call `useSession()` internally to determine login state
  - CRITICAL: when useSession status === 'loading', return null — do NOT render the bar, or else SSR→client hydration will flash the registration bar for logged-in users
  - When status === 'unauthenticated', render the registration bar as before
  - **Acceptance:** `grep -n "isLoggedIn" components/layout/mobile-register-bar.tsx` returns no matches

### 5. FloatingConnectButton Refactor

- [ ] 5.1 Modify `components/connect/floating-connect-button.tsx`
  - Remove `isLoggedIn` prop
  - Call `useSession()` internally (already a client component, no directive change needed)
  - When useSession status === 'loading': return null
  - Retain `hasContact: boolean` prop (non-sensitive)
  - **Acceptance:** `grep -n "isLoggedIn" components/connect/floating-connect-button.tsx` returns no matches

### 6. Detail Page ISR Refactor

- [ ] 6.1 Modify `app/(main)/communities/[slug]/page.tsx`
  - Remove `force-dynamic` / `export const dynamic = 'force-dynamic'`
  - Add `export const revalidate = 3600`
  - Add `generateStaticParams`: query all ACTIVE community slugs; wrap DB call in try/catch — return `[]` on error
  - Remove all auth() / session calls from server component
  - Layer 1 (server-rendered): name, city, district, operator, description, benefits, focusTracks, totalWorkstations, totalArea, entryFriendly, coverImage, address, transit, latitude, longitude, featured, lastVerifiedAt, processTime, website, slug
  - Replace private content sections with `<CommunityPrivateContent slug={community.slug} />`
  - Remove `isLoggedIn` prop from `<MobileRegisterBar>` and `<FloatingConnectButton>`
  - Remove contactPhone/contactWechat/contactName/contactNote from server query select
  - Server still needs to know if community HAS contact info (for FloatingConnectButton hasContact prop). Compute this with a boolean expression in the Prisma select without returning the actual values. Option A: select these 3 fields, compute hasContact !!(contactName || contactPhone || contactWechat), then DELETE the 3 fields from the object before rendering. Option B: use Prisma raw SQL fragment in select. EITHER WAY, contactPhone/contactWechat must never appear in HTML source.
  - Do NOT set `dynamicParams = false` — no `export const dynamicParams` at all (applies default `true`, new communities auto-generate on first visit)
  - **Acceptance:** `npm run build` succeeds; `grep -n "force-dynamic\|auth()\|isLoggedIn" app/\(main\)/communities/\[slug\]/page.tsx` returns no matches

### 7. M1 Build & Smoke Test

- [ ] 7.1 Run `npm run build` — zero TypeScript errors
- [ ] 7.2 Start dev server, visit `/communities/some-slug` as guest — Layer 1 content visible, login gate shown for Layer 2
- [ ] 7.3 Log in, visit same page — Layer 2 content loads via API, contact info masked unless unlocked
- [ ] 7.4 Inspect page source (View Source) — confirm contactPhone/contactWechat absent from HTML

---

## M2: List Page Infinite Scroll

### 8. Communities API — Paginated GET

- [ ] 8.1 Modify `app/api/communities/route.ts` — add (or replace) GET handler
  - Accept query params: `page` (default 1), `pageSize` (default 12, max 24), `city` (optional)
  - Select only card fields: id, slug, name, city, district, coverImage, focusTracks, operator, totalWorkstations, entryFriendly, featured, benefits (pass the FULL JSONB object — community-card already handles this, only shows a badge icon when benefits != null; do NOT truncate or summarize)
  - Order: featured DESC, updatedAt DESC
  - Return: `{ communities: [...], total: number, hasMore: boolean }`
  - Add `export const revalidate = 300` at route level
  - **Acceptance:** `curl "http://localhost:3000/api/communities?page=1&pageSize=12"` returns valid JSON with `communities` array of ≤12 items and `hasMore` boolean

### 9. community-card.tsx — img → Image

- [ ] 9.1 Modify `components/communities/community-card.tsx`
  - Replace all `<img>` tags with Next.js `<Image>` from `next/image`
  - Add appropriate `sizes` prop (e.g. `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`)
  - Add `alt` text if missing
  - **Acceptance:** `grep -n "<img" components/communities/community-card.tsx` returns no matches

### 10. communities-page-client.tsx — Infinite Scroll Refactor

- [ ] 10.1 Modify `components/communities/communities-page-client.tsx`
  - Accept new props: `initialCommunities: Community[]`, `initialTotal: number`
  - Remove any internal full-data fetch on mount
  - State: `communities` (starts with `initialCommunities`), `page` (starts at 1), `hasMore`, `loading`, `activeCity` (from URL param or '')
  - `IntersectionObserver` on a sentinel div at list bottom — triggers `loadMore()` when visible (guard: skip if `loading` or `!hasMore`)
  - `loadMore()`: fetch `/api/communities?page=${page+1}&pageSize=12&city=${activeCity}`, append to `communities`, update `hasMore`
  - City filter behavior:
    - User clicks a city → set activeCity, abort any in-flight fetch, reset page=1, set loading=true
    - Immediately fetch `/api/communities?page=1&pageSize=12&city=${activeCity}` — do NOT rely on initialCommunities for city filtering (initialCommunities only has 12 items for the default/global view)
    - Replace communities state with the API response
    - Update URL via pushState (replaceState is also fine) to `?city=${activeCity}` without navigation
    - When `activeCity === ''` (global view), reset to initialCommunities
  - Show loading spinner during fetch; show "已全部加载" text when `!hasMore`
  - Preserve existing `?city=` param reading on mount (for links from `/data/page.tsx`): set activeCity from URL, fetch first page for that city
  - **Acceptance:** Page loads with 12 communities pre-rendered; scrolling to bottom fetches next page; `?city=苏州` in URL filters correctly on load

### 11. communities/page.tsx — Server Page Refactor

- [ ] 11.1 Modify `app/(main)/communities/page.tsx`
  - Remove `force-static` / any `dynamic = 'force-static'`
  - Add `export const revalidate = 3600` (was 3600, keep consistent)
  - Change Prisma query to fetch only first 12 communities (featured first, then updatedAt DESC) — same card fields as API
  - Pass `initialCommunities` and `initialTotal` props to `<CommunitiesPageClient>`
  - **Acceptance:** `npm run build` succeeds; page HTML contains first 12 communities; payload is < 100KB (down from ~1.2MB)

### 12. M2 Build & Smoke Test

- [ ] 12.1 Run `npm run build` — zero TypeScript errors
- [ ] 12.2 Start dev server, open `/communities` — first 12 cards render instantly from HTML
- [ ] 12.3 Scroll to bottom — next 12 load via API, spinner appears briefly
- [ ] 12.4 Navigate to `/communities?city=苏州` — page loads filtered to 苏州 communities
- [ ] 12.5 Check Network tab — initial HTML payload < 200KB

---

## M3: City SEO Pages

### 13. City Detail Page

- [ ] 13.1 Create `app/(main)/communities/city/[city]/page.tsx`
  - `generateStaticParams`: `SELECT DISTINCT city FROM Community WHERE status = 'ACTIVE'`; wrap in try/catch — return `[]` on error
  - `export const revalidate = 3600`
  - Fetch all ACTIVE communities for the given city (all fields needed for card display)
  - Generate metadata: `title = "${city} OPC社区入驻攻略 - OPC圈"`, `description = "查看${city}全部${count}个OPC社区，了解入驻政策、补贴申请及联系方式。"`
  - Add canonical: `<link rel="canonical" href="https://www.opcquan.com/communities/city/${city}" />`
  - Add `<meta name="robots" content="index, follow" />`
  - Renders community grid using existing `<CommunityCard>` — no pagination (SEO page, full list)
  - Page heading: `<h1>${city} OPC社区（共${count}个）</h1>`
  - NOT linked from any navigation (pure SEO entry point)
  - **Acceptance:** `npm run build` generates static pages for each distinct city; visiting `/communities/city/苏州` renders all 苏州 communities with correct `<title>` tag

### 14. Sitemap — City Pages

- [ ] 14.1 Modify `app/sitemap.ts`
  - Add query: `SELECT DISTINCT city FROM Community WHERE status = 'ACTIVE'`
  - Generate URL entries: `{ url: 'https://www.opcquan.com/communities/city/${city}', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 }`
  - Wrap DB call in try/catch — return empty array on error, don't crash sitemap generation
  - **Acceptance:** `curl http://localhost:3000/sitemap.xml` includes at least one `/communities/city/` URL

### 15. M3 Build & Smoke Test

- [ ] 15.1 Run `npm run build` — zero TypeScript/build errors
- [ ] 15.2 Confirm build output lists city pages (e.g. `○ /communities/city/苏州`)
- [ ] 15.3 Visit `/communities/city/上海` in dev server — page renders with correct title and community list
- [ ] 15.4 View page source — confirm `<title>` and `<meta name="description">` are populated server-side
- [ ] 15.5 Confirm `/communities/city/[city]` pages are NOT linked in main nav or footer

---

## Final Verification

- [ ] 16.1 Run full `npm run build` with all three milestones complete — zero errors
- [ ] 16.2 Run `npm run lint` — zero new lint errors introduced
- [ ] 16.3 Confirm no `/admin` routes or components were modified: `git diff --name-only | grep "admin"` returns empty
- [ ] 16.4 Confirm `/api/inquiries` was not modified: `git diff app/api/inquiries/` shows no changes
- [ ] 16.5 Confirm `/connect/[slug]` page was not modified: `git diff app/\(main\)/connect/` shows no changes
- [ ] 16.6 Security check: view page source of any community detail page — confirm no contactPhone or contactWechat value appears anywhere in HTML
