# Tasks: m3_frontend_detail_refactor

Refactor the public-facing community detail page to display new M1 structured fields.

**Target file:** `app/(main)/communities/[slug]/page.tsx`

All tasks are self-contained edits to that single file unless otherwise noted. Keep the page a pure server component throughout.

---

## Task 1 — focusTracks: Add 赛道标签 badges in Layer 1 header

**What:** In the "快速判断" header section (Layer 1), below the existing `suitableFor` tags and above the `focus` tags, render `community.focusTracks` as orange-tinted tag badges when non-empty.

**Where:** After the `suitableFor` block (line ~264) and before the `focus` block (line ~279).

**Implementation:**
- Add a new `flex flex-wrap gap-2 mb-4` block for `focusTracks`
- Each badge: `inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md font-medium`
- No icon needed (赛道 context is obvious)
- Keep the legacy `focus` block below it (do NOT remove it — some communities still have only `focus`)

**Acceptance criteria:**
- [x] A community with `focusTracks: ["AI", "跨境电商"]` shows two orange badges "AI" and "跨境电商" in Layer 1
- [x] A community with empty `focusTracks` shows no focusTracks section (no empty container)
- [x] Legacy `focus` tags still render for communities that have them
- [x] The order is: suitableFor → focusTracks → focus → tagline

---

## Task 2 — totalWorkstations / totalArea: Prefer new fields in stat chips

**What:** In the "3 stat chips" block (Layer 1, ~line 236), update the workstations and spaceSize chips to prefer the new M1 fields with graceful fallback to legacy.

**Logic:**
- Workstations chip: show `community.totalWorkstations` if non-null, else `community.workstations`. Label: `{value} 个工位`
- Space chip: show `community.totalArea` if non-empty, else `community.spaceSize`
- `hasPolicies` chip: keep as-is (legacy `policies` guard), but add a second chip for `benefits` presence: if `community.benefits` is non-null, also show a `<Gift>` chip "有入驻福利"

**Acceptance criteria:**
- [x] Community with `totalWorkstations: 200` and `workstations: null` → shows "200 个工位"
- [x] Community with `totalWorkstations: null` and `workstations: 50` → shows "50 个工位" (fallback)
- [x] Community with both → prefers `totalWorkstations`
- [x] Same fallback logic for `totalArea` vs `spaceSize`
- [x] Community with non-null `benefits` → shows a "有入驻福利" chip (orange-amber style, same as hasPolicies chip)
- [x] Chip does not appear if `benefits` is null

---

## Task 3 — transit: Show transit info in sidebar location section

**What:** In the sidebar "社区位置" Card (`CardContent`, ~line 584), after `<CommunityLocationMap ... />` and before the optional "注册后查看精确地址" link, add a transit info line.

**Implementation:**
- Only render if `community.transit` is non-empty
- Format: small `<p>` with `🚇` inline prefix, `text-sm text-gray-500 mt-2`
- No LoginGate (transit info is public — it helps users evaluate the location)

**Acceptance criteria:**
- [x] Community with `transit: "地铁2号线海曙站，步行约8分钟"` → displays `🚇 地铁2号线海曙站，步行约8分钟` under the map
- [x] Community with `transit: null` → no transit line rendered
- [x] Transit shows for both logged-in and anonymous users

---

## Task 4 — contactNote: Show hint text under phone in sidebar

**What:** In the sidebar "联系信息" Card, inside the `LoginGate` for contact info (~line 624), after the `contactPhone` line, add `contactNote`.

**Implementation:**
- Only render if `community.contactNote` is non-empty
- Format: `<div className="text-xs text-gray-400 mt-0.5">{community.contactNote}</div>`
- Must be inside the `<LoginGate>` (it's part of protected contact info)

**Acceptance criteria:**
- [x] Community with `contactNote: "工作日9:00-18:00"` → shows grey hint text under the phone number, inside the login gate
- [x] Community with `contactNote: null` → no extra line rendered
- [x] Visible only when logged in (inherits LoginGate behavior)

---

## Task 5 — benefits: Add 五大政策福利 Card in Layer 2 (logged-in)

**What:** In the Layer 2 logged-in block, add a new Card **before** the existing "入驻政策" (`hasPolicies`) card, titled "🎁 入驻福利".

**Data shape** (`community.benefits` as `Json`):
```ts
type BenefitsJson = {
  office?:   { summary: string; items: string[] }
  compute?:  { summary: string; items: string[] }
  business?: { summary: string; items: string[] }
  funding?:  { summary: string; items: string[] }
  housing?:  { summary: string; items: string[] }
}
```

**Section labels:**
| Key | Label |
|-----|-------|
| `office` | 🏢 办公空间 |
| `compute` | 💻 算力资源 |
| `business` | 🤝 业务拓展 |
| `funding` | 💰 资金支持 |
| `housing` | 🏠 安居保障 |

**Implementation:**
- Cast `community.benefits` as `BenefitsJson` (define inline type at top of file, or inline cast)
- Iterate over the 5 keys in order; skip sections where the key is absent
- Each section: section label as `<h4>` with `text-sm font-semibold text-secondary mb-1`, then `summary` as a highlighted `<p className="text-sm text-primary font-medium bg-orange-50 rounded px-2 py-1 mb-2">`, then `items` as a `<ul>` with bullet items `text-sm text-gray-700`
- Only render the Card at all if `community.benefits` is non-null and has at least one key

**Acceptance criteria:**
- [x] Community with `benefits.office` → renders "🏢 办公空间" section with summary + bullet items
- [x] Community with `benefits: { office: ..., funding: ... }` → renders exactly 2 sections (compute/business/housing absent)
- [x] Community with `benefits: null` → benefits Card not rendered at all
- [x] All 5 sections render in the fixed order: office → compute → business → funding → housing
- [x] Summary text is visually distinct from bullet items (orange-tinted bg)
- [x] Card only appears for logged-in users (inside the `isLoggedIn` block)

---

## Task 6 — entryInfo: Add 入驻指南 block in Layer 2 (logged-in)

**What:** In the Layer 2 logged-in block, add a new section **after** the `benefits` Card and **before** the legacy `hasPolicies` card. Title: "📋 入驻指南".

**Data shape** (`community.entryInfo` as `Json`):
```ts
type EntryInfoJson = {
  requirements?: string[]
  steps?:        string[]
  duration?:     string
}
```

**Layout:** Single Card with 3 sub-sections (only render each sub-section if data exists):

1. **入驻条件** — `requirements[]` as a `<ul>` with `CheckCircle2` icon per item (green)
2. **申请流程** — `steps[]` as a numbered `<ol>` using the existing timeline style (same as legacy `entryProcess` rendering)
3. **审核周期** — `duration` string shown as `⏱ {duration}` in a small grey pill

**Migration note:** If `community.entryInfo` has data, render this card. Also check if legacy `community.entryProcess` has data — if both exist, render `entryInfo` only and skip the legacy `entryProcess` block. If only legacy `entryProcess` exists (no `entryInfo`), keep the existing legacy block unchanged.

**Acceptance criteria:**
- [x] Community with `entryInfo.requirements: ["需提供订单佐证"]` → shows "入驻条件" sub-section with that item
- [x] Community with `entryInfo.steps: ["提交BP", "初审", "签约"]` → shows numbered 3-step timeline
- [x] Community with `entryInfo.duration: "10-15个工作日"` → shows `⏱ 10-15个工作日` pill
- [x] Community with partial data (e.g. only `steps`, no `requirements`) → renders only the steps sub-section
- [x] Community with both `entryInfo` and legacy `entryProcess` → renders entryInfo card, skips legacy entryProcess block
- [x] Community with only legacy `entryProcess` (no `entryInfo`) → renders legacy block unchanged
- [x] Community with `entryInfo: null` → no 入驻指南 card rendered

---

## Task 7 — Update login teaser copy to mention new fields

**What:** The "🔓 登录后解锁完整信息" CTA card (main content area, ~line 306) lists bullet points. Update them to reflect the new M1 content, so users know `benefits` and `entryInfo` are waiting.

**Current bullets:**
```
✅ 政策扶持详情（空间补贴、算力补贴等）
✅ 完整入驻流程（{community.entryProcess.length} 步）
✅ 真实入驻说明（创业者经验）
✅ 配套服务详情
✅ 精确地址 & 联系方式
```

**Updated bullets:**
```
✅ 五大入驻福利（办公空间、算力资源、资金支持等）
✅ 完整入驻指南（条件、流程、审核周期）
✅ 真实入驻说明（创业者经验）
✅ 政策详情 & 配套服务
✅ 精确地址 & 联系方式
```

Note: The step count `{community.entryProcess.length}` was dynamic but is removed since `entryInfo` supersedes it.

**Acceptance criteria:**
- [x] Teaser copy no longer references `entryProcess.length`
- [x] Copy mentions "五大入驻福利" and "入驻指南"
- [x] No other visual change to the CTA card

---

## Implementation Order

Execute tasks in this order to minimize context-switching in the file:

1. Task 1 (focusTracks) — Layer 1 header
2. Task 2 (totalWorkstations/totalArea stat chips) — Layer 1 header
3. Task 7 (login teaser copy) — Layer 2 top
4. Task 5 (benefits Card) — Layer 2 logged-in
5. Task 6 (entryInfo block) — Layer 2 logged-in
6. Task 3 (transit) — Sidebar location card
7. Task 4 (contactNote) — Sidebar contact card
