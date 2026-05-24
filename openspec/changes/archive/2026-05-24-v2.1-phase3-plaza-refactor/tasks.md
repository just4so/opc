# Phase 3: 广场三视图重构 — Tasks

> Change: `v2.1-phase3-plaza-refactor`
> Branch: `feat/v2-redesign`

---

## 3.1 新增 GET /api/plaza/projects（公开 API）

**File:** `app/api/plaza/projects/route.ts` (new)

- [ ] Create `GET /api/plaza/projects` — no auth required
- [ ] Query params: `page` (default 1), `limit` (default 20), `direction` (mainTrack filter on owner), `city` (location filter on owner), `stage` (ProjectStage filter on project), `search` (keyword, matches project name OR tagline)
- [ ] Only return projects where `status = PUBLISHED` AND `owner.showInPlaza = true`
- [ ] Include owner info in response: `id, username, name, avatar, bio, location, verified`
- [ ] Order: `owner.verified DESC, project.createdAt DESC`
- [ ] Response shape: `{ projects: [...], pagination: { page, limit, total, totalPages } }`
- [ ] Each project includes: `id, name, tagline, stage, website, contentType, owner: { id, username, name, avatar, bio, location, verified }`

**Acceptance:**
- `curl /api/plaza/projects` returns paginated JSON with correct shape
- `curl /api/plaza/projects?direction=AI&city=北京&stage=LAUNCHED&search=xxx` filters correctly
- Projects from users with `showInPlaza=false` are excluded
- Projects with `status != PUBLISHED` are excluded
- Verified owners' projects appear first

---

## 3.2 广场页重写：三 Tab（人 / 产品 / 动态）

### 3.2a Server Component 重写

**File:** `app/(main)/plaza/page.tsx` (modify)

- [ ] Keep `revalidate = 60`
- [ ] Fetch plaza users (existing) — add `include: { projects: { where: { status: 'PUBLISHED' }, take: 2, orderBy: { createdAt: 'desc' }, select: { id, name, tagline, stage, website } } }`
- [ ] Fetch initial projects page via Prisma (same query as API, first page) for SSR of 产品 tab
- [ ] Fetch posts (existing, keep as-is for 动态 tab)
- [ ] Fetch plaza stats (existing)
- [ ] Remove `lookingFor` and `canOffer` from user select
- [ ] Pass all data to `PlazaClient`

**Acceptance:**
- SSR HTML contains user cards with associated products
- No `lookingFor`/`canOffer` in fetched data
- Each user includes up to 2 projects inline

### 3.2b Client Component 重写

**File:** `components/plaza/plaza-client.tsx` (rewrite)

- [ ] Three tabs: "人" (default), "产品", "动态"
- [ ] Tab state synced to URL param `?tab=people|products|posts` (default: `people`)
- [ ] **人 Tab:**
  - Grid layout: 3 columns desktop, 1 column mobile
  - Card shows: avatar, name, verified badge, bio (2-line clamp), city, mainTrack
  - Below user info: associated products list (name + tagline + stage badge, max 2)
  - Actions: "查看主页" → `/profile/[username]`, "联系TA" → `/messages?to=[username]` (if logged in) or login prompt
  - Client-side filtering from SSR data (same as current pattern)
  - Pagination: client-side from full SSR dataset (50 users)
- [ ] **产品 Tab:**
  - Grid layout: 3 columns desktop, 1 column mobile
  - Card shows: project name, tagline, stage badge, website link (if exists)
  - Owner info block: avatar (small), name, verified badge, city
  - Actions: "了解更多" → `/profile/[username]`, "联系创始人" → same messaging logic
  - Client-side fetch from `/api/plaza/projects` with filters
  - Pagination: API-driven (page param)
- [ ] **动态 Tab:**
  - Keep existing post list functionality fully intact (post type tabs, sort, view mode, sidebar)
  - No regressions on like, comment, pagination, hot topics sidebar

**Acceptance:**
- Tab switch is instant (no full reload), URL updates with `?tab=`
- Sharing a URL with `?tab=products` opens the products tab directly
- 人 tab cards show associated products
- 产品 tab loads from API, shows owner info
- 动态 tab is unchanged from current behavior
- Responsive: single column on mobile for all tabs

---

## 3.3 筛选栏（三视图通用）

**File:** `components/plaza/plaza-client.tsx` (part of 3.2b rewrite)

- [ ] Filter bar above the tab content area, below tabs
- [ ] Filters: 方向 (mainTrack dropdown), 城市 (city dropdown), 阶段 (stage dropdown), 搜索框 (keyword input with debounce)
- [ ] 方向 options: derived from existing `TRACK_OPTIONS` constants (or hardcoded list matching current data)
- [ ] 城市 options: derived from existing user locations in SSR data
- [ ] 阶段 options: `想法 / 开发中 / 已上线 / 有收入 / 已盈利` (matching `ProjectStage` enum display names)
- [ ] Filter behavior per tab:
  - 人 Tab: filter users by `mainTrack`, `location`, `startupStage`, name/bio keyword match (client-side)
  - 产品 Tab: pass `direction`, `city`, `stage`, `search` to `/api/plaza/projects` (server-side)
  - 动态 Tab: keyword search filters posts by content/title (keep existing search if any, or add client-side keyword filter)
- [ ] Filters persist when switching tabs — values stay in URL params: `?tab=people&direction=AI&city=北京&stage=LAUNCHED&search=xxx`
- [ ] Clear all filters button when any filter is active
- [ ] Empty state: "没有找到匹配的结果，试试调整筛选条件" for each tab

**Acceptance:**
- Selecting "方向=AI" on 人 tab, then switching to 产品 tab, keeps the AI filter active
- URL reflects all active filters; pasting the URL reproduces the filtered view
- Search has debounce (300ms) to avoid excessive API calls on 产品 tab
- Empty state shows when no results match

---

## 3.4 顶部引导条

**File:** `components/plaza/plaza-client.tsx` (part of 3.2b rewrite)

- [ ] Colored banner above tabs, conditionally rendered:
  - **Not logged in:** "创建你的名片，让创业者看到你 →" → `/register`
  - **Logged in, no card** (`showInPlaza=false`): "创建你的名片，让 XX 位创业者看到你 →" → `/settings#card` (XX = total plaza user count from stats)
  - **Logged in, has card, no product** (`showInPlaza=true`, 0 projects): "添加你的产品，让更多人找到你 →" → `/settings#card`
  - **Logged in, has card and product:** "编辑我的信息 →" → `/settings#card`
- [ ] Dismissible (X button), dismissed state persists for session (sessionStorage)

**Acceptance:**
- Logged out user sees register prompt
- New user with no card sees card creation prompt with correct user count
- User with card but no project sees product prompt
- User with card and project sees edit link
- Banner can be dismissed, stays dismissed on tab switch but reappears on page reload

---

## 3.5 去掉 lookingFor / canOffer 前端展示

### 3.5a Plaza

**File:** `components/plaza/plaza-client.tsx`

- [ ] Remove `lookingFor` badges from user cards
- [ ] Remove `canOffer` badges from user cards
- [ ] Remove `filterLookingFor` filter dropdown
- [ ] Remove `LOOKING_FOR_OPTIONS` constant (if only used here)

### 3.5b Profile page

**Files:** `components/profile/profile-client.tsx` (or equivalent)

- [ ] Remove display of `lookingFor` section
- [ ] Remove display of `canOffer` section
- [ ] Keep "联系TA" and other profile actions

### 3.5c Settings page

**Files:** `app/(main)/settings/page.tsx` or `components/settings/*`

- [ ] Remove `lookingFor` form field / multi-select
- [ ] Remove `canOffer` form field / multi-select
- [ ] Remove associated options constants from settings
- [ ] Keep all other settings fields intact

### 3.5d API (keep accepting, stop serving)

**File:** `app/api/user/profile/route.ts`

- [ ] Keep `lookingFor` and `canOffer` in PUT allowedFields (no-op if not sent, but doesn't break old clients)
- [ ] Do NOT remove from Prisma schema (explicitly stated constraint)

**Acceptance:**
- No `lookingFor`/`canOffer` visible anywhere in plaza, profile, or settings UI
- Settings form saves successfully without these fields
- Database fields remain untouched
- `npm run build` passes

---

## 3.6 Build verification

- [ ] `npm run build` completes with zero errors
- [ ] No TypeScript errors
- [ ] All existing plaza functionality (posts, likes, comments, pagination) works in 动态 tab
- [ ] Three tabs render correctly with seed data
- [ ] Filters work across all three tabs
- [ ] Mobile responsive layout verified (single column)
