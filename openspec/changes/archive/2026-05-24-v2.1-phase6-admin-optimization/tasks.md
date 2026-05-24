# Phase 6: 后台优化 — Tasks

**Change:** v2.1-phase6-admin-optimization
**Branch:** feat/v2-redesign
**Constraint:** No Prisma schema changes. `npm run build` zero errors.

---

## 6.1 后台侧边栏分组

Reorganize the flat nav list in `app/admin/layout.tsx` into three groups with section headers. Current: 11 flat items. Target:

**运营中心:**
- 意向管理 `/admin/inquiries`
- 认证管理 `/admin/verify`

**内容管理:**
- 社区管理 `/admin/communities`（含认领 Tab，见 6.4）
- 动态管理 `/admin/posts`
- 资讯管理 `/admin/news`
- 政策管理 `/admin/policies`

**系统:**
- 用户管理 `/admin/users`
- 雷达管理 `/admin/radar`
- 系统设置 `/admin/settings`

Note: "合作管理 `/admin/orders`" stays, placed under 内容管理 after 动态管理.

### Files to modify
- `app/admin/layout.tsx` — restructure `NAV_ITEMS` into grouped sections with labels
- `app/admin/admin-sidebar.tsx` — render group headers (小字灰色分组标题) between link sections

### Acceptance criteria
- [ ] Sidebar renders three visible group headings: 运营中心 / 内容管理 / 系统
- [ ] Each group heading is a non-clickable label (text-xs text-gray-400 uppercase tracking-wider, with top margin for spacing)
- [ ] All 11 nav items still work (no broken links)
- [ ] Dashboard link `/admin` stays at the very top, above all groups (standalone, no group)
- [ ] Active state highlighting still works per existing logic
- [ ] `npm run build` passes

---

## 6.2 后台首页 Dashboard 运营数据

Add four operational stat cards to the dashboard. Current dashboard has 6 "total count" cards. Add a new "运营概览" row above the existing cards.

### New API: `GET /api/admin/dashboard`
Returns:
```json
{
  "todayInquiries": 3,
  "pendingClaims": 5,
  "pendingVerifications": 2,
  "weeklyNewUsers": 18
}
```
Queries:
- `todayInquiries`: `prisma.inquiry.count({ where: { createdAt: { gte: todayStart } } })`
- `pendingClaims`: `prisma.communityClaim.count({ where: { status: 'PENDING' } })`
- `pendingVerifications`: `prisma.user.count({ where: { showInPlaza: true, verified: false } })`
- `weeklyNewUsers`: `prisma.user.count({ where: { createdAt: { gte: weekStart } } })`

### Files to create
- `app/api/admin/dashboard/route.ts` — new API, protected with `requireStaff()`

### Files to modify
- `app/admin/page.tsx` — add operational stat row (4 cards in a colored row, e.g. warm background) above existing 6 cards

### Acceptance criteria
- [ ] `GET /api/admin/dashboard` returns 4 integer values, auth-protected
- [ ] Dashboard shows a new "运营概览" section with 4 cards: 今日意向 / 待处理认领 / 待认证用户 / 本周新注册
- [ ] Each card links to its management page (click → navigate)
- [ ] Numbers are correct against database (spot-check)
- [ ] `npm run build` passes

---

## 6.3 意向管理补全：状态 Dropdown + CSV 导出

Current inquiry management (`app/admin/inquiries/inquiries-client.tsx`) only allows forward status transitions (PENDING→CONTACTED→DONE) via a button. Need: dropdown that allows any status change (including back to PENDING), plus CSV export.

### 6.3a Status dropdown
Replace the single "next status" button with a `<select>` dropdown showing all 4 statuses (PENDING/CONTACTED/DONE/CANCELLED). Selected value triggers `PATCH /api/admin/inquiries` (already exists).

### 6.3b CSV export API + button
New endpoint: `GET /api/admin/export/inquiries?status=XXX` returns CSV with columns: 称呼, 联系方式, 意向社区, 城市, 方向, 阶段, 状态, 提交时间. Respects current tab filter.

### Files to create
- `app/api/admin/export/inquiries/route.ts` — CSV export, protected with `requireStaff()`

### Files to modify
- `app/admin/inquiries/inquiries-client.tsx` — replace forward-only button with status `<select>` dropdown; add "导出 CSV" button in header area that downloads `/api/admin/export/inquiries`

### Acceptance criteria
- [ ] Each inquiry row shows a dropdown with 4 status options; current status pre-selected
- [ ] Changing dropdown value fires PATCH and refreshes the list
- [ ] Status can be changed in any direction (e.g. DONE → PENDING)
- [ ] "导出 CSV" button visible in page header, respects current tab filter
- [ ] Downloaded CSV opens correctly in Excel/Numbers with Chinese characters (UTF-8 BOM)
- [ ] `npm run build` passes

---

## 6.4 认领/收录合并到社区管理 Tab

Add a second tab to the community management page. Current: single list view. Target: two tabs — "社区列表" (existing) and "认领与收录" (new, renders CommunityClaim data).

### Claims tab content
Table columns: 类型(CLAIM/SUBMISSION badge) / 社区名称 / 联系人 / 联系方式 / 城市 / 说明 / 状态(badge) / 提交时间.
Data source: `GET /api/admin/community-claims` (already exists, supports `?status=&type=` filters).
Filter tabs within the claims tab: 全部 / 待处理 / 已联系 / 已完成.

### Files to modify
- `app/admin/communities/communities-client.tsx` — wrap existing content in a tab container; add "认领与收录" tab with claims table

### Acceptance criteria
- [ ] Community management page has two tabs: "社区列表" and "认领与收录"
- [ ] Default tab is "社区列表" (existing behavior unchanged)
- [ ] "认领与收录" tab shows a table of all CommunityClaim records
- [ ] Type column shows distinguishing badge: 认领 (blue) vs 收录 (green)
- [ ] Sub-filter tabs within claims view: 全部 / 待处理 / 已联系 / 已完成
- [ ] `npm run build` passes

---

## 6.5 认领状态流转

Add status management for community claims. Current: CommunityClaim.status is always "PENDING" with no way to update. Target: admin can change status via dropdown (PENDING→CONTACTED→COMPLETED).

### New API: `PATCH /api/admin/community-claims`
Body: `{ id: string, status: 'PENDING' | 'CONTACTED' | 'COMPLETED' }`
Updates `communityClaim.status` for the given id.

### Files to create
- Add PATCH handler to `app/api/admin/community-claims/route.ts` (file exists, add PATCH export)

### Files to modify
- The claims table added in 6.4 — add a status dropdown column (same pattern as 6.3a)

### Acceptance criteria
- [ ] `PATCH /api/admin/community-claims` updates status, returns updated record
- [ ] Claims table shows a status dropdown per row: 待处理 / 已联系 / 已完成
- [ ] Changing dropdown fires PATCH, refreshes list
- [ ] Auth-protected (requireStaff)
- [ ] `npm run build` passes

---

## 6.6 系统设置：微信二维码上传 → 直通车成功页展示

The admin settings page (`app/admin/settings/page.tsx`) already has a QR code upload section using `ImageUpload` + R2 + `SiteSetting` key `community_qrcode_url`. The connect form success state (`components/connect/connect-form.tsx` line ~234) shows a placeholder "请在后台上传二维码".

### What's needed
1. A **public** API to read the QR code URL (no auth): `GET /api/settings/qrcode` → returns `{ url: string | null }`
2. The connect form success state fetches this API and renders the image (or keeps placeholder if null)

### Files to create
- `app/api/settings/qrcode/route.ts` — public GET, reads `SiteSetting` where key = `community_qrcode_url`, returns `{ url }`. Cache with `revalidate = 3600`.

### Files to modify
- `components/connect/connect-form.tsx` — in the success state, fetch `/api/settings/qrcode` on mount and display the image if URL exists; keep placeholder text if null

### Acceptance criteria
- [ ] `GET /api/settings/qrcode` returns `{ url: "..." }` when QR code is set, `{ url: null }` when not set
- [ ] No auth required for this endpoint (public)
- [ ] Connect form success page shows the uploaded QR code image when available
- [ ] Shows "请在后台上传二维码" placeholder when no QR code is set
- [ ] Admin settings page upload still works (no regression)
- [ ] `npm run build` passes
