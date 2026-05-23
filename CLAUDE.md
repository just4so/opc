# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

OPC圈（opcquan.com）is a community platform for AI-era "One Person Company" entrepreneurs in China. It aggregates OPC policy information, community resources, and connects entrepreneurs across the country.

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

> **⚠️ CRITICAL for Claude Code:** This project has **NO `src/` directory**. All files live directly under the project root `/Users/wei/Documents/opc`. Never write to `src/` — it does not exist and will create duplicate files.

```
app/                  # ← directly under project root, NOT under src/
├── (auth)/     # Login / Register — no main layout
├── (main)/     # Public pages — shared header/footer layout
├── admin/      # Admin panel — separate layout, role-protected
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
| Communities `/communities` | ISR | 3600s | **全量159条 SSR → 前端 filter/分页，不再调 API** |
| Community detail `/communities/[slug]` | ISR + generateStaticParams | 3600s | **预生成全部静态页，TTFB ~10ms** |
| News `/news` (POLICY tab) | ISR | 3600s | 含「专项政策」区块，直接查 Policy 表 |
| Radar `/radar/[issueNo]` | Dynamic | — | OPC Radar 日报，含侧边栏归档 |
| News list `/news` | ISR | 300s | select 不含 content 字段（省~80%体积） |
| Plaza `/plaza` | ISR | 60s | ~~force-dynamic~~ 改 60s ISR，可接受延迟 |
| Market `/market` | ISR | 120s | **改为 Server Component**，筛选通过 URL searchParams |
| Admin pages | `force-dynamic` | — | Always fresh |

**⚠️ 重要架构决策（2026-03-26）：**

1. **Communities 页去掉 API fetch**：159条社区在 SSR 时全量传给前端，城市筛选和分页全部前端完成。不再调用 `/api/communities`。超过500条时再重新评估。

2. **Market 改为 Server Component**：原来是 Client Component 通过 `useEffect + fetch /api/market` 拉数据（两次串行等待），现在改为 Server Component 直接 Prisma 查询。筛选通过 URL `?type=DEMAND&category=xxx` 驱动。

3. **数据库连接 pgBouncer**：DATABASE_URL 端口改为 6543（Transaction mode），加 `?pgbouncer=true`。DIRECT_URL 保持 5432（migrate 专用）。

**Pattern（现行）：**
- Communities/Market：Server Component 直接查 Prisma，无中间 API 层
- Plaza：Server Component 直接查 Prisma + PlazaClient 负责交互
- 减少"Server Component → API Route → Prisma"的不必要中间层

Example:
```
app/(main)/market/page.tsx       → Server Component (直接 Prisma 查询)
app/(main)/plaza/page.tsx        → Server Component (SSR)
components/plaza/plaza-client.tsx → Client Component ('use client')
```

### Key Patterns

**Authentication & Authorization:**
- `lib/auth.ts` — NextAuth config
- `lib/admin.ts` — `requireStaff()` (ADMIN/MODERATOR), `requireAdmin()` (ADMIN only)
- User roles: `USER`, `MODERATOR`, `ADMIN`
- Admin layout (`app/admin/layout.tsx`) handles role verification

**Database Access:**
- Always import Prisma from `@/lib/db` (not directly from `@prisma/client`)
- Prisma returns `Date` objects — serialize with `.toISOString()` before passing to Client Components

**API Routes:**
- Public APIs: return data directly
- Protected APIs: call `auth()` at the top, check `session.user.role`
- Admin APIs: call `requireStaff()` or `requireAdmin()` — these throw/redirect on failure

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
- `entryFriendly`: 1-5 integer (入驻友好度，displayed as stars in admin; 5=easiest)
- `amenities`: String[] (配套服务，e.g. 会议室、直播间)
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
- `isOriginal`: boolean — original articles use `/news/[id]` detail page; external links open in new tab
- `content`: Markdown body (for original articles)
- `category`: Prisma enum — POLICY | STORY | EVENT | TECH (map from Chinese: 政策资讯→POLICY, 创业干货→STORY, 社区动态→EVENT, 行业观察→TECH)
- `url`: unique constraint — use `original-${Date.now()}-${random}` for original articles

**Policy:**
- `province` / `city` / `district`: 不带「市/省」后缀（如「北京」不是「北京市」）；district 为 null 表示市级政策
- `status`: PolicyStatus enum — ACTIVE | DRAFT | EXPIRED
- 匹配逻辑：区县级（city+district）→ 市级（city, district=null）→ 省级（city=null），orderBy 区级优先 nulls last
- 导入脚本：`scripts/import-policies.ts`（幂等，可重跑）

**RadarItem / RadarIssue / RadarRun / RadarCbArticle:** OPC Radar 日报相关模型，详见 `lib/radar/`

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
// Admin layout handles auth — no need to re-check in page
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
| Dashboard with 7-day trend chart | `/admin` — `TrendChart` component fetches `/api/admin/stats` |
| User list + role change | `/admin/users` — `UsersClient` |
| User detail + post history | `/admin/users/[id]` — Server Component |
| Post management | `/admin/posts` — topic filter, content preview expand, pin/hide/delete |
| News management | `/admin/news` — toggle original, edit author, delete; **+ write original at `/admin/news/new`** |
| Community list (with difficulty stars) | `/admin/communities` |
| Community edit (star rating for entryFriendly) | `/admin/communities/[id]/edit` — `StarRating` inline component in `community-form.tsx` |
| Market management | `/admin/orders` — export CSV |
| Policy management | `/admin/policies` — CRUD，省份/状态筛选；Policy 表维护入口 |
| Radar management | `/admin/radar` — OPC Radar 日报管理，手动编辑 title/summary |

## ⚠️ Tool Usage Rules (MANDATORY)

**File operations MUST use native Bash commands only.**

- ✅ `cat`, `echo`, `tee`, `mkdir`, `cp`, `mv` via the `Bash` tool
- ✅ `npx prisma migrate dev`, `npm install` via the `Bash` tool
- ❌ NEVER call `filesystem.write_file`, `filesystem.execute_command`, or any `filesystem.*` tool — these do NOT exist in this environment
- ❌ NEVER call `write_file`, `create_file`, `execute_command` as standalone tools — they do NOT exist

If you attempt to use any tool other than `Bash`, `Read`, `Edit`, `Write`, `Glob`, `Grep`, or standard Claude Code built-ins, the call will silently fail with no error. Always verify file creation with `ls` after writing.

## Known Limitations / TODOs

- Registration flow does not include user type selection (low priority)
- Notification system not implemented
- Avatar upload not implemented
- Community image upload not implemented
- ActivityBar (home page ticker) shows initial posts only — no live polling (by design, to reduce DB load)

---

## 🚧 V2 改版开发（当前活跃）

> **每次接到 OPC 项目开发任务时，先读本章节确认当前阶段和约束。**

### 当前状态：P2 Batch 1 已完成，等待 Batch 2

**P0 已完成（commits: 098d107, a4b19e9）。** Inquiry 全链路：直通车表单 → API → 联系方式解锁 → 后台看板。

**P1 全部完成：**
1. ✅ 通用直通车 `/connect`（含社区 combobox + 帮我推荐）
2. ✅ 首页 `/` 重写（Hero + 价值卡片 + 卡片预览 + 雷达预览）
3. ✅ 资讯详情页底部通用 CTA
4. ✅ 创业者广场 `/plaza` 重构（双 Tab + 筛选 + 卡片墙）
5. ✅ 用户主页 `/profile/[username]` 改造
6. ✅ 个人设置 `/settings` 创业者卡片 Section
7. ✅ Project CRUD API + Bug fixes（commits 10a9340, bf1840a）

**P2 Batch 1 已完成（commit e76a3b4，2026-05-23 15:30）：**
8. ✅ 认证体系：后台审核页 `/admin/verify` + API + badge展示 + 卡片置顶
9. ✅ 导航重组：精简为 3 项（找社区/创业者广场/OPC雷达）+ 未登录右上角「登录 + 创建卡片」
10. ✅ 后台意向统计条（今日新增/状态分布/热门社区 Top5）

**P2 Batch 2 已完成（commit c42bd8d，2026-05-23 16:30）：**
11. ✅ 通知机制：Notification 模型 + 3 个 API + 铃铛 UI + 触发器（卡片查看/联系/意向状态）
12. ✅ 社区认领：CommunityClaim 模型 + Dialog + API（无需登录）
13. ✅ 社区收录申请：复用 CommunityClaim（type=SUBMISSION）+ Dialog
14. ✅ 后台社区列表加认领申请数量列

**P2 全部完成。V2 改版功能开发完毕，待本地全量测试后 merge 到 main 并部署。**

### 完整计划

详见 `docs/V2-PLAN.md`（5 个阶段、Git 策略、验收标准）。

### PRD

详见 `docs/PRD-v2-redesign.md`（v5.2，35KB，15 章）。**数据模型、API 接口、字段定义以 PRD 为准，不可自行发挥。**

### 设计系统

详见项目根目录 `DESIGN.md`。颜色/字体/圆角/间距/组件以该文件定义的 token 为准。

### 分支规则

- 所有改版代码在 `feat/v2-redesign` 分支上开发，**绝对不能直接提交到 main**
- 每个阶段有独立子分支，完成后 merge 回 `feat/v2-redesign`
- 不跨阶段改文件：后端阶段不碰前端，前端阶段不改 API

### 关键约束

1. Inquiry 模型和 User.showInPlaza 是**纯新增**，不改现有表结构
2. API 接收 `communitySlug`（不是 communityId），后端查 slug → id
3. 后台 API 权限用 `isStaff`（不是 isAdmin），和现有后台一致
4. BP 上传 P0 不实现，显示灰态
5. 注册流程保持现状不改（name+phone+password+email选填+stage/track选填）
6. contactWechat 实际存的是公众号，不是个人微信，展示文案用「公众号」
7. 社区详情页是最高风险页面——改之前截图存档，改完逐项对比
8. **V2 改版开发流程必须走 OpenSpec：** 先 `openspec propose` 生成 spec → 确认 → ACP `openspec apply` 执行 → 完成后 `openspec archive` 归档。纯配置/文档修改可跳过（`--skip-specs`）。读 openspec-dev SKILL.md 获取完整命令。
