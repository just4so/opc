# M2 Admin Form Refactor — Tasks

Refactor the community admin form and API routes to support the 7 new M1 fields, replacing legacy freeform editors with structured editors.

**Files in scope:**
- `lib/validations/community.ts`
- `app/admin/communities/community-form.tsx`
- `app/api/admin/communities/route.ts`
- `app/api/admin/communities/[id]/route.ts`

---

## Task 1 — Update validation schema

**File:** `lib/validations/community.ts`

- [x] Add `transit: z.string().optional().nullable()` (交通信息)
- [x] Add `totalArea: z.string().optional().default('')` (总面积，替代 spaceSize)
- [x] Add `totalWorkstations: z.number().int().positive().optional().nullable()` (总工位数，替代 workstations)
- [x] Add `focusTracks: z.array(z.string()).default([])` (重点赛道，替代 focus)
- [x] Add `contactNote: z.string().optional().default('')` (联系备注)
- [x] Add `benefits: z.record(z.string(), z.any()).optional().nullable()` (五大政策福利 Json)
- [x] Add `entryInfo: z.record(z.string(), z.any()).optional().nullable()` (入驻完整信息 Json)
- [x] Keep all existing fields (`focus`, `spaceSize`, `workstations`, `services`, `entryProcess`, `policies`, `processTime`) as optional/nullable — do NOT remove them from the schema

**Acceptance criteria:**
- `communityCreateSchema` and `communityUpdateSchema` both include all 7 new fields
- `CommunityFormData` type (inferred from schema) includes the new fields
- Existing field definitions are unchanged

---

## Task 2 — Update Community interface and FormData type in community-form.tsx

**File:** `app/admin/communities/community-form.tsx`

- [x] Add to the `Community` interface: `transit`, `totalArea`, `totalWorkstations`, `focusTracks`, `contactNote`, `benefits`, `entryInfo` with correct TypeScript types
- [x] Keep all legacy fields in `Community` interface (`focus`, `spaceSize`, `workstations`, `services`, `entryProcess`, `policies`, `processTime`)
- [x] Update the `FormData` type alias to include the 7 new fields (either via `CommunityFormData` extension or explicit addition)

**Acceptance criteria:**
- No TypeScript errors on the interface/type definitions
- Both new and legacy fields are accessible on `formData` without type errors

---

## Task 3 — Update formData initial state

**File:** `app/admin/communities/community-form.tsx`

- [x] Add initial values for new fields in `useState<FormData>({...})`:
  - `transit: initialData?.transit || ''`
  - `totalArea: initialData?.totalArea || ''`
  - `totalWorkstations: initialData?.totalWorkstations || null`
  - `focusTracks: initialData?.focusTracks || []`
  - `contactNote: initialData?.contactNote || ''`
  - `benefits: (initialData?.benefits as any) || {}`
  - `entryInfo: (initialData?.entryInfo as any) || { requirements: [], steps: [], duration: '' }`
- [x] Keep all legacy field initializations (`focus`, `spaceSize`, `workstations`, etc.) unchanged

**Acceptance criteria:**
- Form loads correctly with existing community data (edit mode)
- Form loads with empty defaults (create mode)
- No runtime errors when `initialData` is undefined

---

## Task 4 — Section A: rename focus → focusTracks

**File:** `app/admin/communities/community-form.tsx`, Section A (身份信息)

- [x] Change the "关注领域" `TagInput` to use `formData.focusTracks` / `updateField('focusTracks', v)` instead of `formData.focus` / `updateField('focus', v)`
- [x] Update the label text to "重点赛道" with placeholder "如: AI、大模型、硬件..."
- [x] Leave the `suitableFor` TagInput unchanged

**Acceptance criteria:**
- Tags entered in the "重点赛道" field are stored in `formData.focusTracks`
- `formData.focus` still exists in state (for legacy API compat) but no longer has a UI input

---

## Task 5 — Section B: rename space fields + add transit

**File:** `app/admin/communities/community-form.tsx`, Section B (位置与空间)

- [x] Replace `spaceSize` text input → `totalArea` text input, label "总面积", placeholder "如: 3000㎡ 或 最小5㎡/工位"
- [x] Replace `workstations` number input → `totalWorkstations` number input, label "总工位数"
- [x] Add `transit` text input after the address field, label "交通信息", placeholder "如: 地铁4号线XX站步行5分钟", bound to `formData.transit` / `updateField('transit', ...)`

**Acceptance criteria:**
- Section B shows: 详细地址 → 交通信息 → 地图选点 → 总面积 / 总工位数
- Values are correctly reflected in `formData`
- `formData.spaceSize` and `formData.workstations` remain in state (for legacy compat) but have no UI input

---

## Task 6 — Section C: add contactNote

**File:** `app/admin/communities/community-form.tsx`, Section C (联系与媒体)

- [x] Add `contactNote` text input below the 联系电话 field, label "联系备注", placeholder "如: 工作日9:00-18:00，加微信备注OPC入驻"
- [x] Bound to `formData.contactNote` / `updateField('contactNote', ...)`

**Acceptance criteria:**
- "联系备注" input appears in the contact section, after phone
- Value saves correctly on form submit

---

## Task 7 — Section D: replace policies with benefits 5-section editor

**File:** `app/admin/communities/community-form.tsx`, Section D (政策与流程)

- [x] Remove the old `policies` freeform editor (4 inputs: policy_name, price_range, support_directions, policy_interpretation)
- [x] Add a "五大政策福利" structured editor with 5 collapsible subsections: 办公空间 (`office`), 算力资源 (`compute`), 业务拓展 (`business`), 资金支持 (`funding`), 安居保障 (`housing`)
- [x] Each subsection has:
  - A "一句话概括" text input bound to `formData.benefits[key].summary`
  - An `ArrayInput` for "具体条款" bound to `formData.benefits[key].items`
- [x] Empty subsections (no summary and no items) are omitted from the payload — only include keys with content
- [x] Helper: define a `BenefitSection` type `{ summary: string; items: string[] }` and update the `benefits` state accordingly
- [x] Remove the `services` TagInput from the UI (keep in state for API compat)

**Acceptance criteria:**
- All 5 subsections render correctly and are independently editable
- Adding summary/items to "办公空间" populates `formData.benefits.office = { summary, items }`
- Leaving a subsection empty results in that key being absent from the submitted payload
- Old `policies` state field remains in `formData` (initialized as `{}`) but has no UI

---

## Task 8 — Section D: replace entryProcess/processTime with entryInfo editor

**File:** `app/admin/communities/community-form.tsx`, Section D (政策与流程)

- [x] Remove the old "入驻流程" `ArrayInput` (bound to `formData.entryProcess`)
- [x] Remove the old "实际办理周期" text input (bound to `formData.processTime`) from Section E
- [x] Add structured "入驻信息" editor with three parts:
  - `ArrayInput` for "入驻条件 (requirements)" — placeholder "如: 需提供订单佐证"
  - `ArrayInput` for "申请流程 (steps)" — placeholder "如: 提交BP"
  - Text input for "审核周期 (duration)" — placeholder "如: 10-15个工作日"
- [x] Bind to `formData.entryInfo.requirements`, `formData.entryInfo.steps`, `formData.entryInfo.duration`
- [x] Keep `formData.entryProcess` and `formData.processTime` in state (for legacy API compat) but remove from UI

**Acceptance criteria:**
- Three entryInfo sub-inputs render in Section D
- `formData.entryInfo` correctly holds `{ requirements: string[], steps: string[], duration: string }`
- Section E (真实信息) no longer shows "实际办理周期" input

---

## Task 9 — Update handleSubmit payload

**File:** `app/admin/communities/community-form.tsx`, `handleSubmit` function

- [x] Include all 7 new fields in the payload object: `transit`, `totalArea`, `totalWorkstations`, `focusTracks`, `contactNote`, `benefits`, `entryInfo`
- [x] Filter `entryInfo.requirements` and `entryInfo.steps` for empty strings (same pattern as `realTips`)
- [x] Strip empty `benefits` subsections before sending (omit keys where both `summary` is blank and `items` is empty)
- [x] Keep legacy fields in the payload with their current (empty/falsy) values so the API can still write them: `focus: []`, `spaceSize: ''`, `workstations: null`, `services: []`, `entryProcess: []`, `processTime: ''`, `policies: {}`

**Acceptance criteria:**
- Submitting a form with `focusTracks: ["AI"]` sends `focusTracks: ["AI"]` in the request body
- Submitting with an empty `benefits.office` omits the `office` key from `benefits` in the payload
- Network request body does not include `newSlug` (already stripped via destructuring)

---

## Task 10 — Update POST API handler

**File:** `app/api/admin/communities/route.ts`

- [x] Add 7 new fields to the `prisma.community.create({ data: {...} })` call:
  - `transit: data.transit || null`
  - `totalArea: data.totalArea || null`
  - `totalWorkstations: data.totalWorkstations`
  - `focusTracks: data.focusTracks`
  - `contactNote: data.contactNote || null`
  - `benefits: data.benefits || undefined`
  - `entryInfo: data.entryInfo || undefined`
- [x] Keep all existing field mappings unchanged (`spaceSize`, `workstations`, `focus`, `services`, `entryProcess`, `policies`, `processTime`, etc.)

**Acceptance criteria:**
- `POST /api/admin/communities` with a payload including `transit: "地铁4号线XX站"` creates a community with that transit value in the DB
- Existing communities can still be created with legacy fields

---

## Task 11 — Update PATCH API handler

**File:** `app/api/admin/communities/[id]/route.ts`

- [x] Add the 7 new field names to the `fields` array used in the dynamic `updateData` loop:
  `'transit'`, `'totalArea'`, `'totalWorkstations'`, `'focusTracks'`, `'contactNote'`, `'benefits'`, `'entryInfo'`
- [x] Keep all existing field names in the `fields` array (`spaceSize`, `workstations`, `focus`, `services`, `entryProcess`, `policies`, `processTime`, etc.)

**Acceptance criteria:**
- `PATCH /api/admin/communities/:id` with `{ transit: "地铁2号线" }` updates that field in DB
- `PATCH` with `{ benefits: { office: { summary: "免租3年", items: [...] } } }` persists the structured JSON
- Patching only `name` does not clear any of the new fields
