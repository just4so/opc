# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

OPC圈(opcquan.com)is a community platform for AI-era "One Person Company" entrepreneurs in China. It aggregates OPC policy information, community resources, and connects entrepreneurs across the country.

## Commands

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build (runs prisma generate first)
npm run lint          # ESLint

# Database
npm run db:push       # Push schema changes to database (dev)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:seed       # Seed community base data
npm run db:seed-plaza # Seed plaza data (users/posts/comments)
npm run db:cleanup    # Clean duplicate communities
npm run db:verify     # Verify community data integrity

# Content
npm run fetch:news    # Fetch news from RSS sources
```

## Architecture

### Tech Stack
- **Next.js 14** App Router (not Pages Router)
- **Prisma 5** ORM with PostgreSQL (Supabase)
- **NextAuth.js v5** beta, credentials provider, JWT strategy
- **TailwindCSS** + **shadcn/ui** + **@tailwindcss/typography**
- **react-markdown** + **remark-gfm** for Markdown rendering
- **Baidu Maps** WebGL API for community map

### Route Groups

> **⚠️ CRITICAL for Claude Code:** This project has **NO `src/` directory**. All files live directly under the project root `/Users/wei/Documents/opc`. Never write to `src/` - it does not exist and will create duplicate files.

```
app/                  # ← directly under project root, NOT under src/
├── (auth)/     # Login / Register - no main layout
├── (main)/     # Public pages - shared header/footer layout
├── admin/      # Admin panel - separate layout, role-protected
└── api/        # API routes

components/           # ← directly under project root
lib/                  # ← directly under project root
constants/            # ← directly under project root
types/                # ← directly under project root
```

### Rendering Strategy

| Page | Strategy | revalidate | Notes |
|------|----------|------------|-------|
| Home `/` | ISR | 300s | Static pre-render with ISR |
| Communities `/communities` | ISR | 3600s | **全量159条 SSR → 前端 filter/分页,不再调 API** |
| Community detail `/communities/[slug]` | ISR + generateStaticParams | 3600s | **预生成全部静态页,TTFB ~10ms** |
| News `/news` (POLICY tab) | ISR | 3600s | 含「专项政策」区块,直接查 Policy 表 |
| Radar `/radar/[issueNo]` | Dynamic | - | OPC Radar 日报,含侧边栏归档 |
| News list `/news` | ISR | 300s | select 不含 content 字段(省~80%体积) |
| Plaza `/plaza` | ISR | 60s | ~~force-dynamic~~ 改 60s ISR,可接受延迟 |
| Market `/market` | ISR | 120s | **改为 Server Component**,筛选通过 URL searchParams |
| Admin pages | `force-dynamic` | - | Always fresh |

**⚠️ 重要架构决策(2026-03-26):**

1. **Communities 页去掉 API fetch**:159条社区在 SSR 时全量传给前端,城市筛选和分页全部前端完成。不再调用 `/api/communities`。超过500条时再重新评估。

2. **Market 改为 Server Component**:原来是 Client Component 通过 `useEffect + fetch /api/market` 拉数据(两次串行等待),现在改为 Server Component 直接 Prisma 查询。筛选通过 URL `?type=DEMAND&category=xxx` 驱动。

3. **数据库连接 pgBouncer**:DATABASE_URL 端口改为 6543(Transaction mode),加 `?pgbouncer=true`。DIRECT_URL 保持 5432(migrate 专用)。

**Pattern(现行):**
- Communities/Market:Server Component 直接查 Prisma,无中间 API 层
- Plaza:Server Component 直接查 Prisma + PlazaClient 负责交互
- 减少"Server Component → API Route → Prisma"的不必要中间层

Example:
```
app/(main)/market/page.tsx       → Server Component (直接 Prisma 查询)
app/(main)/plaza/page.tsx        → Server Component (SSR)
components/plaza/plaza-client.tsx → Client Component ('use client')
```

### Key Patterns

**Authentication & Authorization:**
- `lib/auth.ts` - NextAuth config
- `lib/admin.ts` - `requireStaff()` (ADMIN/MODERATOR), `requireAdmin()` (ADMIN only)
- User roles: `USER`, `MODERATOR`, `ADMIN`
- Admin layout (`app/admin/layout.tsx`) handles role verification

**Database Access:**
- Always import Prisma from `@/lib/db` (not directly from `@prisma/client`)
- Prisma returns `Date` objects - serialize with `.toISOString()` before passing to Client Components

**API Routes:**
- Public APIs: return data directly
- Protected APIs: call `auth()` at the top, check `session.user.role`
- Admin APIs: call `requireStaff()` or `requireAdmin()` - these throw/redirect on failure

**Markdown:**
- Post detail (`/plaza/[id]`) and news detail (`/news/[id]`) use `<ReactMarkdown remarkPlugins={[remarkGfm]}>`
- Wrap content in `<div className="prose prose-gray max-w-none">` for typography styles
- PostCard previews strip Markdown symbols (code blocks → inline code → bold → italic → newlines)

### Data Models

**User:**
- `role`: USER | MODERATOR | ADMIN
- `mainTrack`: startup track (赛道)
- `startupStage`: stage (阶段)
- `level`: 1-5 user level
- `verified`: verified badge

**Community:**
- `slug`: URL-friendly unique identifier
- `status`: ACTIVE | INACTIVE | PENDING
- `entryFriendly`: 1-5 integer (入驻友好度,displayed as stars in admin; 5=easiest)
- `amenities`: String[] (配套服务,e.g. 会议室、直播间)
- `realTips`: String[] (真实入驻说明)
- `lastVerifiedAt`: when info was last verified

**CommunityReview:** User reviews of communities, one per user per community, includes `difficulty` (1-5 star rating)

**Post (创业广场):**
- `type`: DAILY | EXPERIENCE | QUESTION | RESOURCE | DISCUSSION
- `topics`: String[] (话题标签, e.g. ['创业故事', '补贴攻略'])
- `pinned`: boolean (精华/置顶)
- `status`: PUBLISHED | HIDDEN | DELETED

**Project (合作广场):**
- `contentType`: DEMAND | COOPERATION

**News:**
- `isOriginal`: boolean - original articles use `/news/[id]` detail page; external links open in new tab
- `content`: Markdown body (for original articles)
- `category`: Prisma enum - POLICY | STORY | EVENT | TECH (map from Chinese: 政策资讯→POLICY, 创业干货→STORY, 社区动态→EVENT, 行业观察→TECH)
- `url`: unique constraint - use `original-${Date.now()}-${random}` for original articles

**Policy:**
- `province` / `city` / `district`: 不带「市/省」后缀(如「北京」不是「北京市」);district 为 null 表示市级政策
- `status`: PolicyStatus enum - ACTIVE | DRAFT | EXPIRED
- 匹配逻辑:区县级(city+district)→ 市级(city, district=null)→ 省级(city=null),orderBy 区级优先 nulls last
- 导入脚本:`scripts/import-policies.ts`(幂等,可重跑)

**RadarItem / RadarIssue / RadarRun / RadarCbArticle:** OPC Radar 日报相关模型,详见 `lib/radar/`

### UI Design System

Theme (defined in `tailwind.config.ts`):
- Primary: `#F97316` (warm orange)
- Secondary: `#334155` (slate gray)
- Accent: `#10B981` (emerald)

Topic tag colors (defined in `constants/`):
- #创业故事, #经验分享 → blue
- #社区攻略, #补贴攻略 → orange (`#E83E8C` pill)
- #工具推荐 → green (`#20C997`)
- #踩坑记录 → orange-red (`#FD7E14`)

## Common Tasks

### Add new admin feature

```typescript
// 1. API route: app/api/admin/your-feature/route.ts
import { requireAdmin } from '@/lib/admin'
export async function GET(req: Request) {
  await requireAdmin()
  // your logic
}

// 2. Page: app/admin/your-feature/page.tsx
// Admin layout handles auth - no need to re-check in page
export default async function YourFeaturePage() {
  // Server component, direct Prisma access ok
}
```

### Add new public page (SSR + CSR pattern)

```typescript
// 1. Server component: app/(main)/your-page/page.tsx
import prisma from '@/lib/db'
import { YourPageClient } from '@/components/your-page/your-page-client'

export const revalidate = 300 // or 'force-dynamic'

export default async function YourPage({ searchParams }) {
  const data = await prisma.someModel.findMany({ ... })
  return <YourPageClient initialData={data} />
}

// 2. Client component: components/your-page/your-page-client.tsx
'use client'
export function YourPageClient({ initialData }) {
  const [data, setData] = useState(initialData)
  // handle filtering/pagination via fetch('/api/...')
}
```

### Modify Prisma schema

```bash
# 1. Edit prisma/schema.prisma
# 2. Push to database
npm run db:push
# 3. Regenerate client
npm run db:generate
```

### Write Markdown-rendered content

Original news articles and plaza posts support full Markdown:
- Use `**bold**`, `# Heading`, `` `code` ``, `> blockquote`, lists, etc.
- Content is stored as-is in the database
- Rendered in detail pages via `<ReactMarkdown>`

## Admin Features Reference

| Feature | Location |
|---------|----------|
| Dashboard with 7-day trend chart | `/admin` - `TrendChart` component fetches `/api/admin/stats` |
| User list + role change | `/admin/users` - `UsersClient` |
| User detail + post history | `/admin/users/[id]` - Server Component |
| Post management | `/admin/posts` - topic filter, content preview expand, pin/hide/delete |
| News management | `/admin/news` - toggle original, edit author, delete; **+ write original at `/admin/news/new`** |
| Community list (with difficulty stars) | `/admin/communities` |
| Community edit (star rating for entryFriendly) | `/admin/communities/[id]/edit` - `StarRating` inline component in `community-form.tsx` |
| Market management | `/admin/orders` - export CSV |
| Policy management | `/admin/policies` - CRUD,省份/状态筛选;Policy 表维护入口 |
| Radar management | `/admin/radar` - OPC Radar 日报管理,手动编辑 title/summary |

## ⚠️ Tool Usage Rules (MANDATORY)

**File operations MUST use native Bash commands only.**

- ✅ `cat`, `echo`, `tee`, `mkdir`, `cp`, `mv` via the `Bash` tool
- ✅ `npx prisma migrate dev`, `npm install` via the `Bash` tool
- ❌ NEVER call `filesystem.write_file`, `filesystem.execute_command`, or any `filesystem.*` tool - these do NOT exist in this environment
- ❌ NEVER call `write_file`, `create_file`, `execute_command` as standalone tools - they do NOT exist

If you attempt to use any tool other than `Bash`, `Read`, `Edit`, `Write`, `Glob`, `Grep`, or standard Claude Code built-ins, the call will silently fail with no error. Always verify file creation with `ls` after writing.

## Known Limitations / TODOs

- Avatar upload: 通过 R2 presigned URL 实现
- Community image upload: admin 后台已实现
- ActivityBar (home page ticker): 已在 V2 中移除
- BP 上传需要 R2 CORS 配置（已完成）

---

## V2 改版（已上线 2026-05-25）

> V2 改版已合并到 main 并部署到生产环境（opcquan.com）。
> 以下是已上线的功能和架构变更。

### 已上线功能

**核心功能：**
- 社区直通车 `/connect/[slug]` + 通用直通车 `/connect` — 两步表单（基本信息+产品信息），提交自动创建广场卡片
- 创业者广场 `/plaza` — 三视图（人/产品/动态），筛选+搜索
- 创业者卡片体系 — Profile 展示产品+最近活跃+完善度，Settings 三区块（基本信息/卡片/产品）
- 认证体系 — 后台审核 `/admin/verify`，Badge 展示，认证用户置顶
- 通知机制 — 铃铛+面板，触发器（卡片查看24h去重/联系/意向状态变更）
- 社区认领/收录申请 — CommunityClaim 模型，Dialog 提交
- BP 上传 — R2 presigned URL 直传，20MB 限制

**页面改造：**
- 首页重写 — Hero 渐变光晕+网格底纹+gradient 文字，深色数据区，AnimatedCounter
- 社区列表 — 省份分组+推荐社区置顶+搜索框+多关键词 AND 匹配
- 社区详情 — 三层权限（未登录/已登录/已解锁），入驻政策始终可见，联系方式需解锁
- 导航精简 — 找社区·广场·资讯·雷达，毛玻璃效果+滚动感知
- 登录/注册页 — logo 图片替代纯文字，左侧品牌面板

**后台改造：**
- Dashboard — 今日意向/待处理认领/待认证/本周新注册
- 侧边栏分组 — 运营中心/内容管理/系统
- 意向管理 — 状态流转+CSV 导出
- 认领管理 — 合并到社区管理 Tab
- 系统设置 — 多二维码管理（社群+直通车）

**全站视觉统一：**
- DESIGN.md 语义 token 全覆盖（ink/mute/ash/canvas/surface-*/*hairline 等）
- ScrollReveal 滚动入场 + AnimatedCounter 数字动画
- Hero 入场序列 + 卡片 hover 升级 + 按钮按压反馈
- 省份展开过渡 + Tab 切换淡入 + Toast 通知

### 新增数据模型

**Inquiry:** 直通车意向（userId, communityId, communityName, phone, wechat, bio, city, mainTrack, startupStage, projectName, projectTagline, projectStage, projectWebsite, bpFileUrl, showInPlaza, status, notes）

**Notification:** 通知（userId, type[CARD_VIEWED|CARD_CONTACTED|INQUIRY_STATUS], title, content, isRead, relatedId）

**CommunityClaim:** 社区认领/收录（communityId, communityName, contactName, contactInfo, description, status, type[CLAIM|SUBMISSION], city）

**SiteSetting:** 系统设置键值对（key, value）— 用于二维码 URL 等

**User 新增字段：** showInPlaza, verified, verifyType, lastActiveAt

### 新增 API 路由

| API | 功能 | 权限 |
|-----|------|------|
| POST /api/inquiries | 提交直通车意向 | auth |
| GET /api/inquiries | 查询解锁状态 | auth |
| GET/PATCH /api/admin/inquiries | 后台意向管理 | staff |
| GET /api/admin/export/inquiries | CSV 导出 | staff |
| GET /api/admin/dashboard | 后台 Dashboard | staff |
| PUT /api/admin/verify/[userId] | 认证管理 | staff |
| GET /api/admin/verify | 认证列表 | staff |
| POST /api/community-claims | 社区认领/收录 | public（限流） |
| GET/PATCH /api/admin/community-claims | 后台认领管理 | staff |
| GET /api/notifications | 通知列表 | auth |
| PUT /api/notifications/read | 标记已读 | auth |
| GET /api/notifications/unread-count | 未读计数 | auth |
| GET /api/plaza/projects | 广场产品列表 | public |
| POST /api/upload/bp | BP 上传 presigned URL | auth |
| GET/PUT /api/user/card | 创业者卡片 | auth |
| POST/DELETE /api/user/projects/[id] | 产品 CRUD | auth |
| GET /api/settings/qrcode?key=xxx | 公共二维码 | public |
| GET/PATCH /api/admin/settings | 系统设置 | staff |
| GET /api/admin/stats/inquiries | 意向统计 | staff |

### 新增组件

| 组件 | 功能 |
|------|------|
| components/connect/connect-form.tsx | 直通车两步表单 |
| components/connect/contact-unlock.tsx | 联系方式解锁门控 |
| components/connect/floating-connect-button.tsx | 手机端悬浮按钮 |
| components/notifications/notification-bell.tsx | 通知铃铛 |
| components/notifications/notification-panel.tsx | 通知面板 |
| components/communities/community-claim-dialog.tsx | 认领 Dialog |
| components/communities/community-submission-dialog.tsx | 收录 Dialog |
| components/layout/scroll-header.tsx | 导航滚动感知 |
| components/ui/scroll-reveal.tsx | 滚动入场动画 |
| components/ui/animated-counter.tsx | 数字计数动画 |
| components/ui/animated-progress.tsx | 进度条动画 |
| components/ui/toast-notification.tsx | Toast 通知 |
| lib/notifications.ts | 通知创建工具函数 |
| lib/r2.ts | R2 存储工具 |

### Rendering Strategy（更新）

| Page | Strategy | revalidate | Notes |
|------|----------|------------|-------|
| Home `/` | ISR | 600s | unstable_cache + ScrollReveal + AnimatedCounter |
| Communities `/communities` | ISR | 300s | 全量 SSR → 前端省份分组/搜索过滤 |
| Community detail `/communities/[slug]` | ISR | 60s | 三层权限，动态 generateMetadata |
| Connect `/connect/[slug]` | Dynamic | — | noindex，需登录 |
| Plaza `/plaza` | ISR | 60s | 三视图 Tab，SSR 直查 Prisma |
| News `/news` | ISR | 300s | 含「专项政策」区块 |
| Radar `/radar/[issueNo]` | ISR | 300s | OPC Radar 日报 |
| Admin pages | force-dynamic | — | Always fresh |

### 关键设计决策

- 导航四项：找社区 · 广场 · 资讯 · 雷达
- 主标题："OPC创业者，在这里连接、让世界看见"
- CTA："找到我的社区" / "让世界看见我"
- 社区详情三层权限：基本信息+政策始终可见 → 登录后见入驻指南 → 解锁后见联系方式
- 直通车提交自动创建广场卡片（User profile 回写 + Project 创建 + showInPlaza=true）
- 广场不用 lookingFor/canOffer，围绕"人+产品"设计
- showInPlaza 写入 JWT token（signIn 时查库），plaza-client 从 session 读取
- 后台侧边栏三组：运营中心/内容管理/系统

### 分支规则

- V2 已合并到 main，feat/v2-redesign 分支已删除
- 日常开发直接在 main 上，复杂功能开新分支
- 走 OpenSpec 流程：propose → tasks.md → apply → archive

### 文档索引

| 文档 | 内容 |
|------|------|
| docs/PRD-v2-redesign.md | V2 PRD（v5.2，15章） |
| docs/V2-DISCUSSION.md | 9 模块逐页面讨论结论 |
| docs/V2.1-PLAN.md | 7 Phase 开发计划 |
| docs/V2-OPTIMIZATION.md | 21 项优化清单 |
| docs/V2-FIXES-R2.md | Round 2 修复清单 |
| docs/V2-QA-REPORT.md | 代码审计+回归测试报告 |
| docs/V2-VISUAL-FIXES.md | 视觉修复清单 |
| docs/V2-INTERACTION-SPEC.md | 交互优化规格书 |
| docs/V2-MANUAL-TEST.md | 人工测试清单 |
| DESIGN.md | 设计系统（token 定义） |
| docs/community-upgrade-prd.md | 社区粘性升级 PRD（关注/通知/推荐/进展帖/产品详情页） |

### Product Detail Page (Phase 2.5)

**Route:** `app/(main)/projects/[slug]/page.tsx`
- Server Component + ISR (revalidate: 300)
- `generateStaticParams` pre-generates all PUBLISHED projects
- Client interactions in `components/projects/project-detail-client.tsx`

**Components directory:** `components/projects/`
- `project-detail-client.tsx` — Tab switching, follow, comment interactions
- `project-progress-timeline.tsx` — Progress posts timeline
- `project-comment-section.tsx` — Comments (reuses CommentForm)

**Data flow:**
- Post.projectId (optional) links progress posts to projects
- Progress posts appear in BOTH plaza feed AND project detail page
- Comment model already supports projectId (existing schema)

**Visual reference:**
- Page layout → follow `app/(main)/communities/[slug]/page.tsx` structure
- Tab style → follow plaza-client.tsx mainTab pattern
- All colors from DESIGN.md tokens only
- Reuse existing Card/Badge/Button from @/components/ui/

---

## Phase 3: 社区粘性升级（✅ 已完成 2026-05-29）

**PRD:** `docs/community-upgrade-phase3-prd.md`
**分支:** `feature/community-upgrade`（已合并到 main）
**管理:** OpenSpec（T1-T7 全部 archived）

### 核心变更

- 废弃 Like 表，统一用 Favorite 表（userId+postId 或 userId+projectId）
- 新增 Progress 模型（独立于 Post，专门记录产品进展）
- Project 新增 images: String[]（最多 5 张，第一张为封面）
- tagline 字段废弃，内容合并到 description
- 产品详情页改为左右分栏（桌面 60/40，移动端堆叠）
- 广场默认 tab 改为「产品」
- /profile 重定向到 /profile/[username]，/settings 改为「我的」后台
- Daily Digest 邮件替代即时通知邮件（cron 20:00）

### 样式硬约束（MANDATORY — Claude Code 必须遵守）

**1. 颜色：只用 tailwind.config.ts 已定义的语义色**
- ✅ text-ink, text-mute, text-ash, bg-surface-card, border-hairline 等
- ❌ 禁止 hex 硬编码（如 `text-[#333]`、`bg-[#f5f5f5]`）
- ❌ 禁止新增 Tailwind 自定义颜色

**2. 圆角：三级系统，不用中间值**
- `rounded-2xl` (16px) — 卡片、按钮、输入框
- `rounded-[32px]` — 弹窗、大容器（对应 DESIGN.md rounded.lg）
- `rounded-full` — 头像、徽章、搜索栏、筛选标签
- ❌ 禁止 rounded-md / rounded-xl / rounded-sm / rounded-lg（除非是 Tailwind 的 rounded-2xl）

**3. 间距：4px 倍数，用 Tailwind 标准 class**
- ❌ 禁止 style={{}} 内联样式
- ❌ 禁止 arbitrary values（如 `p-[13px]`）除非有明确理由并注释

**4. 交互效果：**
- 卡片 hover: `hover:shadow-sm transition-shadow duration-200`
- 按钮按压: `active:scale-[0.98] transition-transform`
- ❌ 不引入新动画库（framer-motion 等）
- ✅ 现有 ScrollReveal 组件可复用

**5. 组件复用：**
- 新卡片参考 `components/plaza/` 下现有卡片的 class 模式
- Dialog 用 shadcn/ui 的 Dialog
- 按钮用现有 Button 组件（`@/components/ui/button`）
- ❌ 不新建 UI 基础组件
- ✅ 图标统一用 lucide-react

**6. 响应式：**
- 断点：sm(640) / md(768) / lg(1024) / xl(1280)
- 卡片网格：xl:4列 / lg:3列 / md:2列 / sm:1列
- 产品详情页：lg 以上左右分栏，lg 以下堆叠
- 触控目标 ≥ 44×44px

### 执行顺序（T1-T7）

| 阶段 | 内容 | OpenSpec change name |
|------|------|---------------------|
| T1 | DB 迁移（tagline→description + Progress 模型 + images 字段 + 废弃 Like） | `phase3-t1-db-migration` |
| T2 | 产品图片上传（R2 + 上传组件） | `phase3-t2-image-upload` |
| T3 | 卡片重设计（产品卡片 + 人物卡片 + 帖子卡片调整） | `phase3-t3-card-redesign` |
| T4 | 产品详情页重构（左右分栏 + Progress + Dialog） | `phase3-t4-product-detail` |
| T5 | 「我的」后台重构 | `phase3-t5-settings-refactor` |
| T6 | 直通车表单（productTagline→productDescription, maxLength 1000, 图片上传）+ 广场默认 tab + 通知横条 | `phase3-t6-plaza-updates` |
| T7 | 首页热门产品 + Bug 修复 + 废弃代码清理 | `phase3-t7-homepage-cleanup` |

### 验收标准（每个 Task 完成后必须验证）

1. `npm run build` 通过，无 TS 错误
2. `npx prisma validate` 通过（涉及 schema 变更时）
3. 新组件在 dev server 可渲染（不白屏）
4. 对照 PRD 对应章节逐条检查功能点
