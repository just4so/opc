# P2 Batch 2: 通知机制 + 社区运营方入口 + 社区收录申请

## Phase 1: Database Schema

- [x] **1.1 Add Notification model to `prisma/schema.prisma`**
  - Fields: `id` (cuid), `userId`, `type` (String: CARD_VIEWED | CARD_CONTACTED | INQUIRY_STATUS), `title`, `content?`, `isRead` (default false), `relatedId?`, `createdAt`
  - Relation: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  - Indexes: `@@index([userId, isRead])`, `@@index([createdAt])`
  - Add `notifications Notification[]` to User model
  - AC: Field names/types match spec exactly; relation and indexes present

- [x] **1.2 Add CommunityClaim model to `prisma/schema.prisma`**
  - Fields: `id` (cuid), `communityId`, `communityName`, `contactName`, `contactInfo`, `description?`, `status` (String, default "PENDING"), `type` (String, default "CLAIM" — also used for SUBMISSION), `city?` (for submissions), `createdAt`
  - Relation: `community Community @relation(fields: [communityId], references: [id])`
  - Index: `@@index([status])`
  - Add `claims CommunityClaim[]` to Community model
  - AC: Single table handles both CLAIM and SUBMISSION via `type` field; `city` field nullable for submissions

- [x] **1.3 Run `npx prisma db push` and `npx prisma generate`**
  - AC: No errors; `npx prisma generate` completes; new models importable from `@/lib/db`

## Phase 2: Notification APIs

- [x] **2.1 Create `lib/notifications.ts` — helper to create notifications**
  - Export `createNotification({ userId, type, title, content?, relatedId? })` that calls `prisma.notification.create`
  - Export `createCardViewedNotification(ownerId, visitorName)` — wraps createNotification with dedup: skip if a CARD_VIEWED notification from same `relatedId` (visitor userId) exists for this `userId` within last 24h (`createdAt > now - 24h`)
  - Export `createCardContactedNotification(ownerId, contactName)`
  - Export `createInquiryStatusNotification(userId, inquiryId, newStatus)`
  - AC: Each helper sets appropriate `title` (Chinese); dedup query uses index on `[userId, isRead]` + `createdAt` filter

- [x] **2.2 Create `app/api/notifications/route.ts` — GET list**
  - Auth required (`auth()`, return 401 if no session)
  - Query params: `page` (default 1), `limit` (default 20)
  - `prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take })`
  - Return `{ notifications: [...], pagination: { page, limit, total, totalPages } }`
  - Serialize `createdAt` to ISO string
  - AC: Returns only current user's notifications; paginated; newest first

- [x] **2.3 Create `app/api/notifications/read/route.ts` — PUT mark read**
  - Auth required
  - Body: `{ ids: string[] }` or `{ all: true }`
  - If `all: true`: `prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })`
  - If `ids`: `prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { isRead: true } })` — scoped to userId to prevent cross-user updates
  - Return `{ success: true, count: result.count }`
  - AC: Only updates notifications belonging to current user; supports both modes

- [x] **2.4 Create `app/api/notifications/unread-count/route.ts` — GET count**
  - Auth required
  - `prisma.notification.count({ where: { userId, isRead: false } })`
  - Return `{ unreadCount: number }`
  - AC: Single integer response; lightweight query for polling

## Phase 3: Notification Triggers

- [x] **3.1 Profile page view trigger (`app/(main)/profile/[username]/page.tsx`)**
  - After loading the profile user, get current viewer via `auth()`
  - If viewer exists AND viewer.id !== profile user.id AND profile user.showInPlaza is true:
    - Call `createCardViewedNotification(user.id, session.user.name, session.user.id)` (pass visitor id as relatedId)
    - Fire-and-forget (don't await or block page render — use `void createCardViewedNotification(...)`)
  - AC: No notification if viewing own profile; no notification for non-plaza users; 24h dedup per visitor; doesn't slow down page load

- [x] **3.2 "联系TA" trigger in plaza contact flow**
  - Find where plaza "联系TA" / contact action happens (likely in connect form submission or profile contact action)
  - After the contact action succeeds, call `createCardContactedNotification(targetUserId, contactorName)`
  - AC: Notification created when someone initiates contact; includes contactor's display name in title

- [x] **3.3 Inquiry status change trigger (`app/api/admin/inquiries/route.ts` PATCH)**
  - After successful `prisma.inquiry.update`, call `createInquiryStatusNotification(inquiry.userId, inquiry.id, status)`
  - Title should include human-readable status: PENDING→"待处理", CONTACTED→"已联系", DONE→"已完成", CANCELLED→"已取消"
  - AC: Notification created on every status change; relatedId = inquiry.id; title in Chinese

## Phase 4: Notification UI

- [x] **4.1 Create `components/notifications/notification-bell.tsx` — bell icon + badge**
  - Client component (`'use client'`)
  - Poll `/api/notifications/unread-count` every 30s (same pattern as `user-nav.tsx` unread messages)
  - Render `Bell` icon from lucide-react with red dot badge when unreadCount > 0
  - On click: toggle notification dropdown panel
  - AC: Badge shows count (max "9+"); polls stop when component unmounts; uses `useEffect` cleanup

- [x] **4.2 Create `components/notifications/notification-panel.tsx` — dropdown panel**
  - Fetches `/api/notifications?limit=20` on open
  - Each item: icon (Eye for CARD_VIEWED, MessageSquare for CARD_CONTACTED, FileText for INQUIRY_STATUS) + title + relative time + read/unread visual state (unread = font-semibold + left blue border)
  - Click notification: call PUT `/api/notifications/read` with `{ ids: [id] }`, then navigate (CARD_VIEWED → `/profile/me`, CARD_CONTACTED → `/profile/me`, INQUIRY_STATUS → `/settings`)
  - "全部标记已读" button at bottom: PUT with `{ all: true }`, refresh list
  - Empty state: "暂无通知"
  - AC: Panel is positioned absolutely below bell; closes on outside click; max-height with scroll; loading skeleton on fetch

- [x] **4.3 Integrate bell into header (`components/layout/user-nav.tsx`)**
  - Add `NotificationBell` next to the user avatar button (before the avatar, after messages link area)
  - Only render when `status === 'authenticated'`
  - AC: Bell visible on both desktop and mobile; doesn't break existing layout; positioned left of avatar dropdown

## Phase 5: Community Claims & Submissions

- [x] **5.1 Create `components/communities/community-claim-dialog.tsx`**
  - Dialog/modal using shadcn `Dialog` component
  - Form fields: communityName (read-only, pre-filled), contactName (required), contactInfo (required, placeholder "手机号或微信"), description (optional, textarea)
  - Submit to POST `/api/community-claims` with `{ communityId, communityName, contactName, contactInfo, description, type: "CLAIM" }`
  - Success state: show "提交成功，我们会尽快联系您" + close button
  - Validation: contactName and contactInfo required before submit
  - AC: Dialog opens from community detail page; pre-fills community info; no login required; shows success feedback

- [x] **5.2 Create `components/communities/community-submission-dialog.tsx`**
  - Similar dialog for community submission
  - Form fields: communityName (required, user input), city (required, text input), contactInfo (required), description (optional)
  - Submit to POST `/api/community-claims` with `{ communityName, contactName: communityName, contactInfo, city, description, type: "SUBMISSION" }`
  - Note: `communityId` not applicable for submissions — API must handle nullable `communityId`
  - AC: Dialog opens from communities list page; no login required; shows success feedback

- [x] **5.3 Create `app/api/community-claims/route.ts` — POST**
  - No auth required (运营方/外部用户 may not have account)
  - Validate required fields based on `type`: CLAIM requires `communityId` + `contactName` + `contactInfo`; SUBMISSION requires `communityName` + `contactInfo` + `city`
  - For CLAIM: verify community exists via `prisma.community.findUnique({ where: { id: communityId } })`
  - Create `CommunityClaim` record
  - Rate limit: max 5 submissions per IP per hour (check via `x-forwarded-for` header + count recent records — or simpler: just add a note, skip implementation if too complex)
  - Return `{ success: true, id: claim.id }`
  - AC: Creates record; validates community exists for CLAIMs; returns success

- [x] **5.4 Add claim trigger to community detail page (`app/(main)/communities/[slug]/page.tsx`)**
  - After the sidebar QR code card (bottom of sidebar), add a text line: "你是该社区的运营方？" + link "联系我们认领 →"
  - Click opens `CommunityClaimDialog` with `communityId` and `communityName` pre-filled
  - AC: Text visible to all users (logged in or not); positioned at bottom of sidebar; dialog passes community context

- [x] **5.5 Add submission trigger to communities list page (`app/(main)/communities/page.tsx`)**
  - After the FAQ section, before closing, add a centered text block: "没找到你的社区？" + link "申请收录 →"
  - Click opens `CommunitySubmissionDialog`
  - Need to convert to use a client wrapper for the dialog trigger (page.tsx is server component)
  - AC: Text visible below FAQ; dialog works without login; visually subtle (text-sm, text-gray-500)

## Phase 6: Admin — Claims Column

- [x] **6.1 Add claims count to admin communities list**
  - In `app/admin/communities/communities-client.tsx`: extend the Community interface with `_count?: { claims: number }`
  - In the admin API that feeds this page (`app/api/admin/communities/route.ts`): add `_count: { select: { claims: true } }` to the include
  - Add a "认领" column in the table showing claim count (0 = gray dash, >0 = orange badge with count)
  - Clicking the badge opens an inline expandable section (or navigate to a simple modal) showing the claims list (contactName, contactInfo, description, createdAt, status)
  - AC: Column visible; counts accurate; claims viewable without leaving the page

- [x] **6.2 Create `app/api/admin/community-claims/route.ts` — GET list for admin**
  - Staff auth required
  - Query params: `communityId` (optional filter), `status` (optional), `type` (optional)
  - Returns claims list with community name, sorted by createdAt desc
  - AC: Only staff can access; filters work; includes both CLAIMs and SUBMISSIONs

## Phase 7: Build & Verify

- [x] **7.1 Run `npm run build` — zero errors**
  - Fix any type errors, import issues, or build failures
  - AC: `npm run build` exits 0; no TypeScript errors; no lint errors

- [ ] **7.2 Manual smoke test checklist**
  - [ ] Visit `/profile/[username]` as another user → notification created for profile owner
  - [ ] Check notification bell shows unread count
  - [ ] Open notification panel → see notification list
  - [ ] Click "全部标记已读" → badge clears
  - [ ] On community detail page → "联系我们认领" link visible, dialog opens and submits
  - [ ] On communities list → "申请收录" link visible, dialog opens and submits
  - [ ] Admin communities page → claims count column shows
  - [ ] Inquiry status change in admin → notification created for inquiry user
