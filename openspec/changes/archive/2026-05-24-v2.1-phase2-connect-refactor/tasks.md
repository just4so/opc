# Phase 2: 直通车重构 + 社区详情三层权限

> Change: `v2.1-phase2-connect-refactor`
> Branch: `feat/v2-redesign`
> Constraint: No Prisma schema changes. `npm run build` must pass with zero errors.

---

## Task 2.1: 社区详情三层权限改造

**Files:** `app/(main)/communities/[slug]/page.tsx`, `components/connect/contact-unlock.tsx`

### Current state
- Two layers: basic info always visible; benefits/entry-guide/real-tips/amenities gated behind `LoginGate` (login required)
- Contact info uses `ContactUnlock` component (checks inquiry unlock status)
- Non-logged-in users see login prompt for Layer 2 content

### Target state — three layers

| Content | Not logged in | Logged in, not unlocked | Unlocked (has inquiry) |
|---------|:---:|:---:|:---:|
| Basic info, description, address, stats | Visible | Visible | Visible |
| Policy (local policies sidebar) | Visible | Visible | Visible |
| Entry guide (入驻指南) | Hidden | Visible | Visible |
| Real tips (真实提醒) | Hidden | Visible | Visible |
| Benefits (入驻权益) | Hidden | Visible | Visible |
| Amenities (配套服务) | Hidden | Visible | Visible |
| Gallery | Hidden | Visible | Visible |
| Contact info (phone/wechat/email) | Hidden | Blurred + CTA | Visible |

### Acceptance criteria

- [ ] **Not logged in:** Entry guide, real tips, benefits, amenities, gallery, and contact info are all hidden. A single CTA block replaces them: "登录后查看入驻指南和联系方式" with login button (redirects back after login).
- [ ] **Logged in, not unlocked:** Entry guide, real tips, benefits, amenities, gallery are visible. Contact info section shows blurred placeholder with CTA text: "提交资料后由 OPC圈 审核推荐，同时解锁联系方式" and a "社区直通车" button linking to `/connect/[slug]`.
- [ ] **Unlocked (user has submitted inquiry for ANY community):** All content visible including full contact info.
- [ ] Unlock check: call `GET /api/inquiries` which returns `{ unlocked: boolean }` — reuse existing endpoint.
- [ ] Communities with no contact info: contact section shows "提交意向，专人帮你对接" with connect button (no blurred area).
- [ ] Reviews section remains always visible (no permission gating).
- [ ] Floating connect button (mobile) still works for all states.
- [ ] `npm run build` passes.

---

## Task 2.2: 直通车表单重设计（两步）

**Files:** `components/connect/connect-form.tsx`, `app/(main)/connect/page.tsx`, `app/(main)/connect/[slug]/page.tsx`

### Current state
- Step 1: name, contact, city, community (combobox with "帮我推荐")
- Step 2 (optional): introduction, stage, wantCard, wantVerify, BP upload (disabled)
- Success page inline in form component

### Target state — two steps, redesigned fields

**Step 1: 基本信息**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text | Yes | Prefill from `session.user.name` if available |
| contact (微信号) | text | Yes | Label: "微信号（用于社区对接）" |
| city | select | Yes | Reuse existing CITIES constant |
| community | combobox | Yes (unless pre-filled) | Show "社区名 · 城市" format (Task 2.4) |

**Step 2: 关于你和你的产品**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| bio | textarea | No | "一句话介绍自己", max 200 chars |
| productName | text | No | "产品/服务名称" |
| productTagline | text | No | "一句话介绍产品", max 100 chars |
| productStage | select | No | Options: 想法阶段/开发中/已上线/有收入/已盈利 |
| productWebsite | text | No | "产品网站（选填）" |
| bpFile | file | No | Task 2.5 handles this |
| showInPlaza | checkbox | Default checked | "同时展示在创业者广场" |

### Acceptance criteria

- [ ] Step 1 shows 4 fields: name, contact (label "微信号"), city, community.
- [ ] Step 2 shows product-focused fields: bio, productName, productTagline, productStage, productWebsite, showInPlaza checkbox (default checked).
- [ ] Remove old fields: `introduction`, `stage` (old select), `wantCard`, `wantVerify`.
- [ ] Step 2 has "跳过，先提交基本信息" skip button that submits with Step 1 data only.
- [ ] "上一步" button on Step 2 returns to Step 1 with data preserved.
- [ ] Form pre-fills `name` from session user if available.
- [ ] Community pre-filled and read-only when arriving from `/connect/[slug]`.
- [ ] Validation: name required, contact required, city required, community required (or "帮我推荐").
- [ ] Submit sends all fields to `POST /api/inquiries` (API changes in Task 2.3).
- [ ] `npm run build` passes.

---

## Task 2.3: 直通车提交联动

**File:** `app/api/inquiries/route.ts`

### Current state
- POST creates Inquiry record
- Syncs user fields: name (if empty), location, mainTrack, startupStage, phone/wechat, showInPlaza

### Target state — full linkage on submit

On successful inquiry creation, the API must:

1. **Create Inquiry** — same as now, with new fields mapped:
   - `name` → `inquiry.name`
   - `contact` → `inquiry.contact`
   - `city` → `inquiry.city`
   - `communitySlug` → resolve to `communityId`
   - `bio` → NOT stored on Inquiry (goes to User)
   - `bpUrl` / `bpFilename` → `inquiry.bpUrl` / `inquiry.bpFilename`

2. **Update User profile** (always, overwrite):
   - `user.bio` = `bio` (if provided)
   - `user.location` = `city` (if provided)
   - `user.name` = `name` (if currently empty)
   - `user.wechat` = `contact` (WeChat from form)
   - `user.showInPlaza` = `showInPlaza` value

3. **Create Project** (if `productName` is provided):
   - `project.name` = `productName`
   - `project.tagline` = `productTagline`
   - `project.stage` = map productStage to Project stage enum (IDEA/BUILDING/LAUNCHED/REVENUE/PROFITABLE)
   - `project.website` = `productWebsite`
   - `project.ownerId` = `session.user.id`
   - `project.status` = `PUBLISHED`
   - `project.contentType` = `PROJECT`
   - `project.slug` = auto-generate from productName (slugify + uniqueness suffix)

4. **Wrap in transaction** — all three operations (inquiry + user update + project create) in `prisma.$transaction`.

### Acceptance criteria

- [ ] Zod schema updated: accept `bio`, `productName`, `productTagline`, `productStage`, `productWebsite`, `showInPlaza`, `bpUrl`, `bpFilename`. Remove old `introduction`, `stage`, `wantCard`, `wantVerify`.
- [ ] Inquiry created with core fields (name, contact, city, communityId, bpUrl, bpFilename).
- [ ] User.bio updated if `bio` provided.
- [ ] User.location updated if `city` provided.
- [ ] User.wechat updated from `contact`.
- [ ] User.showInPlaza set to `showInPlaza` value.
- [ ] Project created when `productName` is non-empty, with correct stage mapping.
- [ ] Project NOT created when `productName` is empty/missing.
- [ ] All writes wrapped in `prisma.$transaction`.
- [ ] Duplicate check still works (userId + communityId + PENDING/CONTACTED).
- [ ] GET endpoint unchanged (`{ unlocked: boolean }`).
- [ ] `npm run build` passes.

---

## Task 2.4: 直通车社区选择带城市

**File:** `components/connect/connect-form.tsx`

### Current state
- Combobox options show community name only
- "帮我推荐" option at the top

### Target state
- Options show `"社区名 · 城市"` (e.g., "深圳湾创业广场 · 深圳")
- "帮我推荐" remains as special option (no city suffix)
- Search filters on both name and city

### Acceptance criteria

- [ ] Each community option displays as `"{name} · {city}"`.
- [ ] "帮我推荐" option remains at top without city suffix.
- [ ] Typing a city name (e.g., "深圳") filters to communities in that city.
- [ ] Typing a community name still works as before.
- [ ] Selected value displays in the same `"name · city"` format.
- [ ] Pre-filled community (from slug page) shows `"name · city"` format.
- [ ] `npm run build` passes.

---

## Task 2.5: BP/公司介绍上传（R2）

**Files:** `lib/r2.ts` (new), `app/api/upload/route.ts` (new), `components/connect/connect-form.tsx`

### Current state
- BP upload button exists but is disabled ("即将开放")
- Inquiry model already has `bpUrl` and `bpFilename` fields
- R2 env vars already in `.env`: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

### Implementation

**`lib/r2.ts`:**
- Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Create S3Client configured for R2 (endpoint from env)
- Export `getPresignedUploadUrl(key: string, contentType: string)` → returns `{ uploadUrl, publicUrl }`
- Key format: `bp/{userId}/{timestamp}-{filename}`

**`app/api/upload/route.ts`:**
- Auth-gated (401 if not logged in)
- Accept: `{ filename: string, contentType: string }`
- Validate: contentType must be `application/pdf` or common document types; file size limit communicated to client
- Return: `{ uploadUrl: string, publicUrl: string, key: string }`

**Form integration:**
- Replace disabled "上传 BP" button with functional file input
- Accept: `.pdf, .doc, .docx, .ppt, .pptx` (max 10MB)
- Upload flow: select file → call `/api/upload` for presigned URL → PUT file to R2 → store `publicUrl` and filename in form state
- Show upload progress indicator
- Show filename + remove button after successful upload
- Prompt text: "上传 BP 或公司介绍，可大幅提高推荐成功率"
- On form submit: pass `bpUrl` and `bpFilename` to inquiry API

### Acceptance criteria

- [ ] `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` installed.
- [ ] `lib/r2.ts` exports `getPresignedUploadUrl` function.
- [ ] `GET/POST /api/upload` returns presigned URL with auth check.
- [ ] Form shows file input accepting `.pdf, .doc, .docx, .ppt, .pptx`.
- [ ] File size validation: reject > 10MB with user-friendly error.
- [ ] Upload progress shown during file upload.
- [ ] After upload: filename displayed with remove (X) button.
- [ ] `bpUrl` and `bpFilename` sent to inquiry API on form submit.
- [ ] File removed from form state (not R2) when X clicked.
- [ ] Works without upload — field is optional, form submits fine without file.
- [ ] `npm run build` passes.

---

## Task 2.6: 直通车成功页改造

**File:** `components/connect/connect-form.tsx` (inline success state)

### Current state
- Success message: "已成功提交直通车意向"
- Shows community contact info if available
- "急需对接？" section with hardcoded WeChat: `opcquan01`
- Links to /plaza and /communities

### Target state

**Layout (top to bottom):**
1. Success icon + heading: "资料已提交"
2. Body text: "OPC圈将在 1 个工作日内审核，审核通过后将直接推荐给社区"
3. WeChat QR code section:
   - Heading: "关注 OPC圈 公众号，第一时间获取审核结果"
   - QR code image: placeholder for now — show gray box with text "请在后台上传二维码"
   - (Future: read from `/api/admin/settings` → `platformQrCodeUrl`)
4. Retention hooks (two buttons/links):
   - "去广场看看其他创业者 →" → `/plaza`
   - "完善你的创业者卡片 →" → `/settings#card`

### Acceptance criteria

- [ ] Heading: "资料已提交".
- [ ] Body text: "OPC圈将在 1 个工作日内审核，审核通过后将直接推荐给社区".
- [ ] QR code area: gray placeholder box (200x200) with text "请在后台上传二维码".
- [ ] Remove old "急需对接？" section with hardcoded WeChat.
- [ ] Remove community contact info display from success page.
- [ ] Link 1: "去广场看看其他创业者" → `/plaza`.
- [ ] Link 2: "完善你的创业者卡片" → `/settings#card`.
- [ ] No broken layout — success page looks clean and intentional.
- [ ] `npm run build` passes.

---

## Implementation order

```
2.4 (combobox city format — small, independent)
  ↓
2.2 (form redesign — new fields, depends on 2.4 format)
  ↓
2.5 (R2 upload — can parallel with 2.2 but form integration needs 2.2)
  ↓
2.3 (API linkage — depends on 2.2 field names)
  ↓
2.1 (three-layer permissions — independent of form, but test after API works)
  ↓
2.6 (success page — last, simple)
```

Tasks 2.1 and 2.4 are independently implementable. Tasks 2.5 backend (`lib/r2.ts` + API) can be built in parallel with 2.2.
