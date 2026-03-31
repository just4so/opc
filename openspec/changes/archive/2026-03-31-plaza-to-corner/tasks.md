# Implementation Tasks: plaza-to-corner

## Phase 1: Schema

### T1.1 — Add new PostType enum values
- **File**: `prisma/schema.prisma`
- **What**: Add `CHAT`, `HELP`, `SHARE`, `COLLAB` to the `PostType` enum. Keep old values (`DAILY`, `EXPERIENCE`, `QUESTION`, `RESOURCE`, `DISCUSSION`) in place — they are removed in Phase 6 after migration.
- **Constraints**: Old values must remain until Phase 6. New values appended below existing ones.

### T1.2 — Add new fields to Post model
- **File**: `prisma/schema.prisma`
- **What**: Add these optional fields to the `Post` model:
  - `title        String?`
  - `contentHtml  String?`
  - `budgetMin    Int?`
  - `budgetMax    Int?`
  - `budgetType   BudgetType?`
  - `deadline     DateTime?`
  - `skills       String[]`
  - `contactInfo  String?`
  - `contactType  ContactType?`
- **Constraints**: `BudgetType` and `ContactType` enums already exist on the `Project` model — reuse them, do NOT redeclare. All fields are optional so no existing rows break.

### T1.3 — Push schema to database
- **Command**: `npm run db:push` then `npm run db:generate`
- **Constraints**: Must run after T1.1 and T1.2.

---

## Phase 2: Migration

### T2.1 — Create migration script
- **File**: `scripts/migrate-plaza.ts`
- **What**: TypeScript script using Prisma that:
  1. Prints pre-migration counts: `DAILY:N EXPERIENCE:N QUESTION:N RESOURCE:N DISCUSSION:N` and total Post count.
  2. In a Prisma transaction, remaps all Post records: `DAILY→CHAT`, `DISCUSSION→CHAT`, `QUESTION→HELP`, `EXPERIENCE→SHARE`, `RESOURCE→SHARE`.
  3. Queries all `Project` records (any contentType) and creates Post records: `title=project.name`, `content=project.description` (strip HTML), `contentHtml=null`, `type=COLLAB`, `topics=[project.category]`, `authorId=project.ownerId`; directly maps `budgetMin`, `budgetMax`, `budgetType`, `deadline`, `skills`, `contactInfo`, `contactType`, `likeCount`, `commentCount`, `viewCount`, `createdAt`.
  4. Prints post-migration counts: `CHAT:N HELP:N SHARE:N COLLAB:N`, new total Post count, confirmed migrated project count (expected: 22).
- **Constraints**: Use a transaction for atomicity. Do NOT delete Project records. Import Prisma from `../../lib/db` (relative from scripts/). Match the runner pattern already used by other scripts in `package.json`.

### T2.2 — Add script entry to package.json
- **File**: `package.json`
- **What**: Add `"migrate-plaza"` script entry. Check existing `db:seed` and other script entries to determine the correct runner (`tsx`, `ts-node`, etc.) and replicate the pattern.
- **Constraints**: Must match existing runner pattern exactly.

---

## Phase 3: API

### T3.1 — Update GET /api/posts (new fields + contactInfo auth gate)
- **File**: `app/api/posts/route.ts`
- **What**:
  - Include `title`, `contentHtml`, `budgetMin`, `budgetMax`, `budgetType`, `deadline`, `skills`, `contactType` in the response for each post.
  - `contactInfo`: call `auth()`, return actual value if session exists, `null` otherwise.
  - `type` filter parameter: accept `CHAT`, `HELP`, `SHARE`, `COLLAB`.
- **Constraints**: Do not break existing pagination or topic-filter logic. Apply `contactInfo` null-out per-post in response mapping.

### T3.2 — Update POST /api/posts (accept new fields, sanitize HTML)
- **File**: `app/api/posts/route.ts`
- **What**:
  - Accept `title`, `contentHtml`, `budgetMin`, `budgetMax`, `budgetType`, `deadline`, `skills`, `contactInfo`, `contactType` from request body.
  - Sanitize `contentHtml` server-side with `sanitize-html` whitelist: `p, h1, h2, h3, strong, em, ul, ol, li, a, img, blockquote, pre, code`.
  - Auto-derive `content` by stripping all tags from `contentHtml` (`allowedTags: []`). Frontend must NOT send `content`.
  - For COLLAB type, validate `contactInfo` is non-empty; return 400 if missing.
- **Constraints**: `sanitize-html` already installed. `content` must still be populated for card preview compatibility.

### T3.3 — Create GET /api/tags/search
- **File**: `app/api/tags/search/route.ts` (new)
- **What**: Accept `q` query param. Aggregate all `Post.topics` values, filter where tag contains `q` (case-insensitive), count frequency, sort descending, return top 10 as `string[]`. Empty `q` returns top 10 overall.
- **Constraints**: Public endpoint — no auth required. Use Prisma `findMany` + JS aggregation (no raw SQL needed). No caching required now.

### T3.4 — Create POST /api/upload/post-image
- **File**: `app/api/upload/post-image/route.ts` (new)
- **What**: Accept multipart form data with image file. Requires authenticated user (call `auth()`, return 401 if no session). Upload to R2 reusing the same SDK pattern as `app/api/admin/upload/community-image/route.ts`. Return `{ url: string }`.
- **Constraints**: Must NOT require staff/admin role. Reuse existing R2 env vars and upload utility logic.

### T3.5 — Update /api/market to return empty array
- **File**: `app/api/market/route.ts`
- **What**: Replace the Prisma query with a direct return of an empty result matching the current response shape (inspect the file first).
- **Constraints**: Keep the file and response shape intact — do not delete or change the status code. Callers must not break.

---

## Phase 4: Components

### T4.1 — Create PostRichTextEditor component
- **File**: `components/plaza/post-rich-text-editor.tsx`
- **What**: `'use client'` component wrapping Tiptap. Extensions: `StarterKit`, `Image`, `Link`, `Placeholder`, `Typography`. Props: `value?: string`, `onChange: (html: string) => void`, `placeholder?: string`. Toolbar: Bold, Italic, Link (insert/edit), Image upload, Code block, Ordered list, Unordered list. On `onUpdate`, call `onChange(editor.getHTML())`. Image upload button sends file to `POST /api/upload/post-image` and inserts returned URL as `<img>` node.
- **Constraints**: New file — do NOT modify `components/admin/rich-text-editor.tsx`. Reference admin editor for Tiptap extension setup patterns only. Image upload uses `/api/upload/post-image`, not the admin endpoint.

### T4.2 — Create TagInput component
- **File**: `components/plaza/tag-input.tsx`
- **What**: `'use client'` component. Props: `value: string[]`, `onChange: (tags: string[]) => void`, `maxTags?: number` (default 5), `placeholder?: string`. Behavior: Enter or comma creates tag (lowercase + trim); debounced 300ms call to `GET /api/tags/search?q=<input>` shows dropdown; clicking suggestion adds it and closes dropdown; X removes tag; at `maxTags` limit, disable input and show「最多N个标签」.
- **Constraints**: Implement debounce with `useEffect` + `setTimeout` — do NOT install a debounce library.

---

## Phase 5: Frontend

### T5.1 — Update PostCard component
- **File**: `components/plaza/post-card.tsx`
- **What**:
  - Type label pill in card header: `CHAT`=gray (💬聊聊), `HELP`=orange (❓求助), `SHARE`=green (📣分享), `COLLAB`=blue (🤝找人).
  - If `post.title` is non-null, show it bold on its own line above content preview.
  - Content preview: strip tags from `contentHtml` if present (simple regex `replace(/<[^>]*>/g, '')`), else use `content`. Truncate to 100 chars with ellipsis.
  - COLLAB type: extra info row — budget summary (面议 / 固定:N元 / N-N元) + deadline「截止：YYYY-MM-DD」if set.
- **Constraints**: Preview tag-stripping is client-side display only — use regex, no library. Do not break existing card layout for non-COLLAB posts.

### T5.2 — Update plaza feed page
- **Files**: `app/(main)/plaza/page.tsx`, `components/plaza/plaza-client.tsx`
- **What**:
  - Page title「交流广场」, subtitle「OPC创业者的交流空间」.
  - Replace old type tabs with 5 options: 全部 / 💬聊聊 / ❓求助 / 📣分享 / 🤝找人. Desktop: horizontal tab buttons. Mobile (<768px): native `<select>` dropdown.
  - Left sidebar (desktop only, computed server-side in `page.tsx` via direct Prisma): (1)「热议话题」top 10 tags from last 7 days; (2)「本周活跃用户」top 5 users by post count this week — entire section hidden if <5; (3)「发布统计」this week + this month post counts. Pass sidebar data as props to client component.
- **Constraints**: ISR `revalidate = 60` stays. No new API route for sidebar data — compute in `page.tsx` with Prisma. Do not break existing post infinite scroll or interaction logic.

### T5.3 — Rebuild /plaza/new page
- **Files**: `app/(main)/plaza/new/page.tsx`, extract client logic to `components/plaza/post-create-form.tsx`
- **What**:
  - 4 intent selection cards at top: 💬聊聊/❓求助/📣分享/🤝找人, each with one-line description. Selected card visually highlighted.
  - Common fields (all types): optional title text input; `PostRichTextEditor` for content (required — block submit if empty); `TagInput` for topics (max 5).
  - COLLAB-only extra fields (visible when COLLAB selected): 预算类型 selector (NEGOTIABLE/FIXED/RANGE); `budgetMin`/`budgetMax` number inputs visible only when RANGE; optional deadline date picker; skills free-input TagInput (max 10); 联系方式类型 selector (微信/邮件/电话) + 联系内容 text input (required for COLLAB).
  - On submit: POST to `/api/posts` with all fields. Do NOT send `content` — API derives it. Redirect to `/plaza` on success.
- **Constraints**: Form must be a `'use client'` component. Validate `contactInfo` client-side for COLLAB before submit. Requires T4.1, T4.2 to be complete.

### T5.4 — Update navigation
- **File**: `components/layout/nav-links.tsx` (check for other nav files referencing `/market` or「合作广场」)
- **What**: Remove「合作广场」link (`/market`). Rename「创业广场」label to「交流广场」(URL `/plaza` unchanged). Search for and update any other component that links to `/market` or displays「合作广场」.
- **Constraints**: Verify mobile nav is covered (may be same file or separate). Do not break other nav items.

---

## Phase 6: Cleanup

> **Execute Phase 6 ONLY after the migration script has been run in production and the post-migration report confirms: 0 records with old type values, Post count increased by 22.**

### T6.1 — Remove old PostType enum values from schema
- **File**: `prisma/schema.prisma`
- **What**: Delete `DAILY`, `EXPERIENCE`, `QUESTION`, `RESOURCE`, `DISCUSSION` from the `PostType` enum. Final enum: exactly `CHAT`, `HELP`, `SHARE`, `COLLAB`.
- **Constraints**: Only safe after migration verification. Run `npm run db:push` + `npm run db:generate` immediately after.

### T6.2 — Push cleaned schema
- **Command**: `npm run db:push` then `npm run db:generate`
- **Constraints**: Must follow T6.1.

### T6.3 — Remove stale references to old enum values
- **Files**: Search codebase for `DAILY`, `EXPERIENCE`, `QUESTION`, `RESOURCE`, `DISCUSSION` used as PostType values (constants, admin filters, seed scripts, display maps). Remove or update each.
- **Constraints**: Run `npm run build` to confirm zero TypeScript errors after cleanup.

---

## Execution Order Constraints

```
T1.1 → T1.2 → T1.3                  # Schema first, push before any code uses new fields
T1.3 → T2.1                          # DB columns must exist before migration script writes them
T1.3 → T3.1, T3.2                    # API reads/writes new columns after schema push

T3.3 → T4.2                          # /api/tags/search must exist before TagInput calls it
T3.4 → T4.1                          # /api/upload/post-image must exist before editor calls it
T4.1 → T5.3                          # PostRichTextEditor must exist before /plaza/new uses it
T4.2 → T5.3                          # TagInput must exist before /plaza/new uses it
T5.1 → T5.2                          # PostCard must be updated before feed renders it

# Phase 6 is strictly post-production-migration:
T2.1 (run + verified in prod) → T6.1 → T6.2 → T6.3

# Can be done in parallel:
T3.1 + T3.2          (same file, do together in one pass)
T3.3 + T3.4 + T3.5  (independent new/modified routes)
T4.1 + T4.2          (independent new components)
T5.1 + T5.4          (independent component updates)
```
