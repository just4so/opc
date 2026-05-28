# Community Upgrade — Implementation Tasks

> Change: community-upgrade
> PRD: docs/community-upgrade-prd.md
> Dependencies flow: Task 1 → Task 2 → Task 4/6; Task 3/5 independent

---

## Task 1: Follow System (Data Model + API + UI)

**Description:** Implement user-to-user follow relationships. This is the foundation — Tasks 2, 4, and 6 depend on it.

**Schema changes** (`prisma/schema.prisma`):
- Add `Follow` model with `followerId`, `followingId`, unique constraint, indexes
- Add `followers`/`following` relations to `User` model

**Files to create:**
- `app/api/users/[id]/follow/route.ts` — POST (follow), DELETE (unfollow), GET (check status)
- `app/api/users/[id]/followers/route.ts` — GET paginated follower list
- `app/api/users/[id]/following/route.ts` — GET paginated following list
- `components/follow/follow-button.tsx` — Client component with optimistic UI (primary → secondary toggle)
- `app/(main)/profile/[username]/followers/page.tsx` — Follower list page
- `app/(main)/profile/[username]/following/page.tsx` — Following list page

**Files to modify:**
- `prisma/schema.prisma` — Add Follow model + User relations
- `app/(main)/profile/[username]/page.tsx` — Add follower/following counts, Follow button
- `app/(main)/plaza/[id]/page.tsx` — Add Follow button in author area

**Acceptance criteria:**
- [ ] `Follow` model exists in schema, `npm run db:push` succeeds
- [ ] POST `/api/users/[id]/follow` creates follow (returns 200), is idempotent
- [ ] DELETE `/api/users/[id]/follow` removes follow (returns 200)
- [ ] GET `/api/users/[id]/follow` returns `{ isFollowing: boolean }`
- [ ] GET `/api/users/[id]/followers?page=1&limit=20` returns paginated list with user info
- [ ] GET `/api/users/[id]/following?page=1&limit=20` returns paginated list with user info
- [ ] Cannot follow self (400 error)
- [ ] Unauthenticated requests return 401
- [ ] Follow button on profile page toggles between "关注" / "已关注" with loading state
- [ ] Follow button on post detail author area works identically
- [ ] Follow button does NOT appear on plaza name cards (PostCard component)
- [ ] Profile page shows follower/following counts (clickable, navigate to list pages)
- [ ] Follower/following list pages render with pagination, each item links to user profile
- [ ] Mobile responsive: button and lists render correctly on <768px
- [ ] Empty state on follower/following pages: "还没有关注的人" / "还没有粉丝" with CTA
- [ ] `npm run build` passes with no TS errors

**Dependencies:** None (first task)

---

## Task 2: Notification System Upgrade

**Description:** Extend the existing notification system with new interaction types (follow, like, comment, reply). Upgrade the notification panel UI with click-through navigation, unread styling, and "mark all read." Implement unified polling with visibility state awareness.

**Files to create:**
- `app/api/unread-summary/route.ts` — Unified unread count endpoint (replaces separate polling)

**Files to modify:**
- `prisma/schema.prisma` — No schema change needed (Notification model already has flexible `type` string field)
- `lib/notifications.ts` — Add `createFollowNotification()`, `createPostLikedNotification()`, `createPostCommentedNotification()`, `createCommentRepliedNotification()`
- `components/notifications/notification-panel.tsx` — Add click-through navigation, unread background, "全部标为已读" button, icons for new types
- `components/notifications/notification-bell.tsx` — Switch to unified `/api/unread-summary` polling, add visibility state pause/resume
- `app/api/users/[id]/follow/route.ts` — Trigger NEW_FOLLOWER notification on follow
- `app/(main)/plaza/[id]/page.tsx` or `components/plaza/post-interactions.tsx` — Trigger POST_LIKED / POST_COMMENTED notifications on like/comment
- `app/api/notifications/read/route.ts` — Add "mark all" support (PUT without specific IDs)

**Acceptance criteria:**
- [ ] Following a user creates a NEW_FOLLOWER notification for the target user
- [ ] Liking a post creates a POST_LIKED notification for the post author (not self-likes)
- [ ] Commenting creates a POST_COMMENTED notification for the post author (not self-comments)
- [ ] Replying to a comment creates a COMMENT_REPLIED notification for the comment author
- [ ] Notification panel items are clickable — NEW_FOLLOWER → profile, POST_LIKED/POST_COMMENTED/COMMENT_REPLIED → post detail
- [ ] Unread notifications have a distinct background color (use `surface-raised` or equivalent token)
- [ ] "全部标为已读" button marks all notifications as read in one click
- [ ] `/api/unread-summary` returns `{ unreadCount: number }` — single endpoint replaces separate polling
- [ ] Polling pauses when `document.visibilityState === 'hidden'`, refreshes immediately on tab focus
- [ ] Polling interval is 60 seconds
- [ ] No duplicate notifications for same action (e.g., re-liking after unlike doesn't spam)
- [ ] `npm run build` passes with no TS errors

**Dependencies:** Task 1 (Follow model must exist for NEW_FOLLOWER notifications)

---

## Task 3: Interaction Visibility Optimization

**Description:** Make existing interactions (likes, comments) more visible across plaza cards, homepage, and post detail. Increase engagement surface area without adding new features.

**Files to modify:**
- `components/plaza/post-card.tsx` — Upgrade like/comment counters to use colored icons (not grey), add author avatar+name as clickable link to profile
- `app/(main)/page.tsx` — Replace "最新入驻的创业者" section with "最新动态" showing 3-5 recent posts with content
- `app/(main)/plaza/[id]/page.tsx` — Show first 3 comments expanded by default; add placeholder text "说点什么鼓励一下？" to comment input; add CSS heartbeat animation on like button click

**Files to create:**
- None (all modifications to existing files)

**Acceptance criteria:**
- [ ] Post cards in plaza show like icon in orange (`primary` token) and comment icon in slate with counts — not all grey
- [ ] Post cards show author avatar (32px circle) + username, clickable to `/profile/[username]`
- [ ] Homepage "最新动态" section shows 3-5 recent published posts with: title/first line, author name, timestamp, like+comment counts
- [ ] Homepage section has "查看更多" link to `/plaza`
- [ ] If no posts exist, section shows empty state: "还没有动态，去广场发第一条吧" with CTA to `/plaza`
- [ ] Post detail page shows 3 comments by default (not collapsed), with "查看更多评论" to expand
- [ ] Comment input has placeholder: "说点什么鼓励一下？"
- [ ] Like button has CSS keyframe heartbeat animation (scale 1→1.2→1) on click, duration ≤300ms
- [ ] No new animation libraries added (CSS only, <5 lines of keyframes)
- [ ] Mobile responsive: all changes render correctly on <768px
- [ ] `npm run build` passes with no TS errors

**Dependencies:** None (independent, can be done in parallel with Task 1)

---

## Task 4: Post Detail Page Sidebar Recommendations

**Description:** Add a right-side recommendation panel on the post detail page (desktop). Shows: author's other posts, same-track creators (excluding followed), and related posts by topic. Mobile: collapses below comments.

**Files to create:**
- `components/plaza/post-sidebar.tsx` — Server component rendering 3 recommendation sections
- `components/plaza/recommended-creator-card.tsx` — Creator card: avatar + name + bio + Follow button
- `components/plaza/recommended-post-card.tsx` — Post card: title/excerpt + author + time

**Files to modify:**
- `app/(main)/plaza/[id]/page.tsx` — Restructure layout to 2/3 + 1/3 grid on desktop, stack on mobile

**Acceptance criteria:**
- [ ] Desktop (≥1024px): post detail shows content in left 2/3, sidebar in right 1/3
- [ ] Mobile (<768px): sidebar content appears below comments section
- [ ] Sidebar section 1 — "TA 的其他动态": shows up to 3 recent posts by the same author (excludes current), links to post detail
- [ ] Sidebar section 2 — "同方向创业者": shows up to 5 users with same `mainTrack` as post author, excludes already-followed users (for logged-in), excludes post author, ordered by `lastActiveAt` DESC
- [ ] Sidebar section 3 — "相关帖子": shows up to 3 posts sharing at least one `topics` tag with current post, excludes current post
- [ ] Each creator card has avatar, name, one-line bio, and Follow button (uses `FollowButton` from Task 1)
- [ ] Each post card shows title/first 50 chars, author name, relative time
- [ ] Empty sections are hidden (not rendered), not shown with empty state
- [ ] If all 3 sections would be empty, sidebar is not rendered at all
- [ ] Sidebar data is fetched server-side (no client fetch, no loading spinner for sidebar)
- [ ] `npm run build` passes with no TS errors

**Dependencies:** Task 1 (Follow model needed for "exclude already followed" logic and Follow button)

---

## Task 5: "Progress Update" Post Type + Profile Timeline

**Description:** Add a PROGRESS post type for "build in public" updates. Show a timeline view of progress posts on user profiles.

**Schema changes** (`prisma/schema.prisma`):
- Add `PROGRESS` to `PostType` enum

**Files to create:**
- `components/plaza/progress-timeline.tsx` — Timeline component: vertical line with dots, each progress post as a timeline entry
- `components/plaza/milestone-badge.tsx` — Optional milestone tag display (e.g., "上线了", "第一个用户")

**Files to modify:**
- `prisma/schema.prisma` — Add `PROGRESS` to PostType enum
- `app/(main)/plaza/new/page.tsx` — Add PROGRESS option with description "记录你的创业里程碑"
- `components/plaza/post-card.tsx` — Render PROGRESS type with left border timeline indicator
- `components/plaza/plaza-client.tsx` — Add PROGRESS to type filter options
- `app/(main)/profile/[username]/page.tsx` — Add "进展" tab showing ProgressTimeline component
- `constants/index.ts` or relevant constants file — Add milestone label options: ["上线了", "有了第一个用户", "月收入1k", "获得融资", "团队扩张", "突破里程碑"]

**Acceptance criteria:**
- [ ] `PROGRESS` value added to PostType enum, `npm run db:push` succeeds
- [ ] New post form shows PROGRESS as a type option with label "创业进展" and description "记录你的创业里程碑"
- [ ] When creating a PROGRESS post, user can optionally select a milestone tag (dropdown, not required)
- [ ] PROGRESS posts in plaza feed show a left-side colored border (4px, primary color) to differentiate
- [ ] If milestone tag is set, it shows as a small badge/pill on the post card
- [ ] User profile page has a "进展" tab (after existing tabs)
- [ ] "进展" tab renders a vertical timeline: left line with dots, posts chronologically descending
- [ ] Timeline entries show: milestone badge (if any), post content excerpt, full date, like/comment counts
- [ ] Each timeline entry links to the full post detail page
- [ ] Empty state for "进展" tab: "还没有进展记录，去记录你的第一个里程碑吧" with CTA to `/plaza/new`
- [ ] Plaza "动态" tab filter includes PROGRESS type
- [ ] Mobile responsive: timeline renders correctly on <768px (full width, no horizontal scroll)
- [ ] `npm run build` passes with no TS errors

**Dependencies:** None (independent, can be done in parallel with Tasks 1-3)

---

## Task 6: Onboarding Recommendations + Email Notifications (Resend)

**Description:** Two sub-features: (A) Show personalized creator recommendations to new users on their first visit to guide first follow; (B) Send transactional emails via Resend for key events (followed, commented, daily digest for likes/views).

### 6A: Onboarding Recommendations

**Schema changes** (`prisma/schema.prisma`):
- Add `onboardingCompleted Boolean @default(false)` to User model

**Files to create:**
- `components/plaza/onboarding-recommendations.tsx` — Banner component shown at top of plaza for new users: "发现和你方向相似的创业者" with 3-5 recommended users + follow buttons + dismiss action

**Files to modify:**
- `prisma/schema.prisma` — Add `onboardingCompleted` to User
- `app/(main)/plaza/page.tsx` — Conditionally render onboarding banner for users with `onboardingCompleted === false`
- `app/api/users/[id]/follow/route.ts` — After first follow, set `onboardingCompleted = true`

### 6B: Email Notifications (复用现有 nodemailer + 腾讯企业邮箱)

**Files to create:**
- `lib/notification-emails.ts` — 通知邮件发送函数: `sendFollowEmail()`, `sendCommentEmail()`, `sendDailyDigestEmail()`（复用 `lib/mailer.ts` 的 transporter）
- `app/api/cron/daily-digest/route.ts` — 每日汇总：聚合昨日点赞+名片查看，发送摘要邮件
- `components/settings/email-preferences.tsx` — 邮件通知开关组件

**Files to modify:**
- `prisma/schema.prisma` — Add `emailNotifications Boolean @default(true)` to User
- `app/(main)/settings/page.tsx` — Add email notification toggle section
- `app/api/users/[id]/follow/route.ts` — Send follow email (if target has `emailNotifications: true`)
- `app/(main)/plaza/[id]/page.tsx` or comment handler — Send comment email

**技术方案：** 复用 `lib/mailer.ts` 已有的 nodemailer transporter（腾讯企业邮箱 SMTP），邮件模板参考现有的 `generateVerifyEmailHtml` 风格（橙色渐变头部+白色卡片）。不引入 Resend。

**Acceptance criteria (6A - Onboarding):**
- [ ] New users (onboardingCompleted=false) see a recommendation banner at top of `/plaza`
- [ ] Banner title: "发现和你方向相似的创业者"
- [ ] Shows 3-5 users matching by `mainTrack` first, then by `location`, with Follow buttons
- [ ] After following at least 1 person, banner auto-dismisses and `onboardingCompleted` is set to true
- [ ] Users can also manually dismiss the banner (sets `onboardingCompleted = true`)
- [ ] If no recommendations available (no matching users), shows: "成为第一个被推荐的人——完善你的信息" with link to `/settings`
- [ ] Banner does not appear for users who already have `onboardingCompleted = true`
- [ ] Mobile responsive: recommendations stack vertically on <768px

**Acceptance criteria (6B - Email Notifications):**
- [ ] `lib/notification-emails.ts` 复用 `lib/mailer.ts` 的 nodemailer transporter（不引入新依赖）
- [ ] Following a user sends email to target: subject "有人关注了你", body contains follower name + CTA link to site
- [ ] Comment on post sends email to post author: subject "{name} 评论了你的动态", body contains comment excerpt + CTA
- [ ] Daily digest cron (`/api/cron/daily-digest`) sends one email per user summarizing yesterday's likes + card views
- [ ] Emails are NOT sent if `user.emailNotifications === false`
- [ ] Emails are NOT sent for self-actions (self-like, self-comment)
- [ ] Settings page has "邮件通知" toggle that updates `emailNotifications` field
- [ ] Each email body includes unsubscribe text: "不想收到邮件？在设置中关闭邮件通知"
- [ ] 邮件使用 HTML 模板（参考 `lib/mailer.ts` 现有的品牌风格：橙色渐变头部+白色卡片+CTA 按钮）
- [ ] 每封邮件底部有退订引导文案："不想收到邮件？在设置中关闭邮件通知"
- [ ] `npm run build` passes with no TS errors

**Dependencies:** Task 1 (Follow model), Task 2 (Notification triggers — email piggybacks on same events)

---

## Dependency Graph

```
Task 1 (Follow) ──────┬──→ Task 2 (Notifications)
                       ├──→ Task 4 (Sidebar Recommendations)
                       └──→ Task 6 (Onboarding + Email)
                                    └──→ depends on Task 2 also

Task 3 (Visibility) ────→ independent
Task 5 (Progress Posts) ─→ independent
```

## Implementation Order

**Parallel batch 1:** Task 1 + Task 3 + Task 5
**Parallel batch 2:** Task 2 (after Task 1)
**Parallel batch 3:** Task 4 + Task 6 (after Tasks 1+2)

---

## Phase 2.5 — Product Home + Interaction Upgrade

> Dependencies: Task 8 → Task 7 → Task 9 (serial)
> All tasks on branch `feature/community-upgrade`

---

## Task 8: Progress Posts Bind to Product (Schema + Form)

**Description:** Link progress posts to products via optional `projectId`. Upgrade the post creation form to allow selecting a related product. Show product association on post cards.

**Schema changes** (`prisma/schema.prisma`):
- Add `projectId String?` to Post model
- Add `project Project? @relation(fields: [projectId], references: [id])` to Post model
- Add `posts Post[]` to Project model
- Add index: `@@index([projectId, type, createdAt])` on Post model

**Files to create:**
- `app/api/user/projects/list/route.ts` — GET current user's projects (for dropdown in post form)

**Files to modify:**
- `prisma/schema.prisma` — Post model add projectId + relation + index
- `app/(main)/plaza/new/page.tsx` — Add "关联产品" dropdown when type=PROGRESS; auto-fill from URL param `?projectId=xxx`
- `app/api/posts/route.ts` — Accept optional `projectId` in POST body
- `components/plaza/post-card.tsx` — If post has projectId, show small tag "关于：[产品名]" linking to `/projects/[slug]`
- `app/(main)/profile/[username]/page.tsx` — Progress tab: add [记录一下？] button (links to `/plaza/new?type=PROGRESS`)

**Acceptance criteria:**
- [ ] Post model has optional `projectId` field, `npm run db:push` succeeds
- [ ] POST `/api/posts` accepts `projectId`, stores it correctly
- [ ] GET `/api/user/projects/list` returns current user's projects (id, name, slug)
- [ ] Post creation form shows product dropdown when type=PROGRESS (populated from API)
- [ ] URL param `?projectId=xxx` auto-selects the product in dropdown
- [ ] PostCard shows "关于：[产品名]" tag when post has projectId, tag links to `/projects/[slug]`
- [ ] Posts without projectId work exactly as before (backward compatible)
- [ ] Profile progress tab has [记录一下？] button linking to `/plaza/new?type=PROGRESS`
- [ ] `npx tsc --noEmit` passes with zero errors

**Dependencies:** None (first in Phase 2.5)

---

## Task 7: Product Detail Page

**Description:** Create a full product detail page at `/projects/[slug]` with three tabs: Introduction, Progress Timeline, Comments. This gives products a "home" inside opcquan instead of just linking to external sites.

**Files to create:**
- `app/(main)/projects/[slug]/page.tsx` — Server Component, ISR revalidate 300s, generateStaticParams for all PUBLISHED projects
- `components/projects/project-detail-client.tsx` — Client Component: tab switching (介绍/进展记录/评论), follow product (reuse Favorite), share
- `components/projects/project-progress-timeline.tsx` — Vertical timeline of PROGRESS posts linked to this project
- `components/projects/project-comment-section.tsx` — Comments section (reuse CommentForm, pass projectId)
- `app/api/projects/[slug]/comments/route.ts` — GET paginated comments, POST new comment (auth required)

**Page structure:**
```
Header: [Logo] Name + Tagline          [收藏] [访问网站↗]
Meta:   Stage | MRR (if public) | Tech Stack | Owner avatar+name+FollowButton
Tabs:   [介绍] [进展记录] [评论]
---
介绍 tab: description (Markdown rendered) + screenshots gallery
进展 tab: Timeline of linked PROGRESS posts (newest first). Owner sees [+ 记录进展] button → links to /plaza/new?type=PROGRESS&projectId=xxx
评论 tab: Comment list + CommentForm (reuse existing components)
```

**Visual constraints:**
- Page layout follows `app/(main)/communities/[slug]/page.tsx` structure
- Tab style follows plaza-client.tsx mainTab pattern (underline active tab)
- All colors from DESIGN.md tokens (primary/secondary/mute/ink/ash)
- Components from @/components/ui/ (Card, Badge, Button, Tabs)
- Mobile responsive: single column, tabs stack naturally
- Empty states: "暂无进展记录" with CTA; "暂无评论，来说点什么？"

**Performance:**
- ISR revalidate 300s
- generateStaticParams pre-generates all published project pages
- Comments loaded client-side (not blocking SSR)
- Progress posts query uses @@index([projectId, type, createdAt])

**Acceptance criteria:**
- [ ] `/projects/[slug]` renders full product info (name, tagline, description, stage, techStack)
- [ ] Three tabs switch correctly, URL does not change on tab switch (client-side state)
- [ ] 介绍 tab: Markdown description rendered, screenshots displayed
- [ ] 进展 tab: Shows PROGRESS posts linked to this project, newest first, vertical timeline
- [ ] 进展 tab: Owner sees [+ 记录进展] button, non-owner does not
- [ ] 评论 tab: Can submit comment (auth required), displays nested replies
- [ ] Owner name/avatar clickable → `/profile/[username]`
- [ ] [访问网站] button opens external link in new tab
- [ ] 收藏 button works (reuse Favorite model with projectId)
- [ ] Mobile responsive: all content readable on <768px
- [ ] Empty states render correctly for all three tabs
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] ISR works: page loads fast on repeat visits

**Dependencies:** Task 8 (needs Post.projectId for progress tab query)

---

## Task 9: Plaza Card Interaction Upgrade + Cleanup

**Description:** Upgrade plaza people cards with inline follow buttons and clickable avatars. Change product cards from external links to internal `/projects/[slug]` links. Add batch follow-status API. Clean up dead code.

**Files to create:**
- `app/api/user/following-status/route.ts` — GET `?ids=id1,id2,id3` returns `{ [userId]: boolean }` for current user

**Files to modify:**
- `components/plaza/plaza-client.tsx` — People cards: add FollowButton, make avatar/name Link to profile, make project name Link to /projects/[slug]. Product cards: change product name from external link to internal `/projects/[slug]`, add commentCount/likeCount display, add owner avatar
- Import FollowButton from `@/components/follow/follow-button`

**Files to delete:**
- `app/api/market/route.ts` — Dead code, no references
- `app/api/market/[slug]/route.ts` — Dead code, no references

**Batch follow status logic:**
- On people tab mount, collect all displayed user IDs
- Single fetch to `/api/user/following-status?ids=xxx,yyy,zzz`
- Pass `isFollowing` prop to each FollowButton
- Unauthenticated users: skip the fetch, all buttons show "关注"

**Visual constraints:**
- FollowButton: reuse existing component (small variant if available, otherwise default)
- People card layout: avatar (left) + info (center) + FollowButton (right-aligned)
- Product card: keep existing card structure, just change link targets
- No new CSS classes or colors

**Acceptance criteria:**
- [ ] People cards: avatar clickable → profile page
- [ ] People cards: name clickable → profile page
- [ ] People cards: FollowButton visible, toggles correctly
- [ ] People cards: project name clickable → `/projects/[slug]`
- [ ] Product cards: product name links to `/projects/[slug]` (NOT external URL)
- [ ] Product cards: show commentCount and likeCount
- [ ] Product cards: owner avatar visible and clickable → profile
- [ ] Batch follow status: single API call, not N+1
- [ ] Unauthenticated: follow buttons show "关注", click → /login
- [ ] Dead code removed: `app/api/market/` directory deleted
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] No visual regression on existing plaza functionality

**Dependencies:** Task 7 (product detail page must exist for internal links to work)

---

## Phase 2.5 Execution Order

```
Task 8 (Schema + Progress Bind) → Task 7 (Product Detail Page) → Task 9 (Card Upgrade + Cleanup)
```

Serial execution. Each task verified before starting next.
