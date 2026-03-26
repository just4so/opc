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
| Communities `/communities` | ISR | 3600s | **全量104条 SSR → 前端 filter/分页，不再调 API** |
| Community detail `/communities/[slug]` | ISR + generateStaticParams | 3600s | **预生成全部104个静态页，TTFB ~10ms** |
| News list `/news` | ISR | 300s | select 不含 content 字段（省~80%体积） |
| Plaza `/plaza` | ISR | 60s | ~~force-dynamic~~ 改 60s ISR，可接受延迟 |
| Market `/market` | ISR | 120s | **改为 Server Component**，筛选通过 URL searchParams |
| Admin pages | `force-dynamic` | — | Always fresh |

**⚠️ 重要架构决策（2026-03-26）：**

1. **Communities 页去掉 API fetch**：104条社区(71.5KB)在 SSR 时全量传给前端，城市筛选和分页全部前端完成。不再调用 `/api/communities`。超过500条时再重新评估。

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
- `applyDifficulty`: 1-5 integer (入驻难度，displayed as stars in admin)
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
| Community edit (star rating for difficulty) | `/admin/communities/[id]/edit` — `StarRating` inline component in `community-form.tsx` |
| Market management | `/admin/orders` — export CSV |

## Known Limitations / TODOs

- Registration flow does not include user type selection (low priority)
- Notification system not implemented
- Avatar upload not implemented
- Community image upload not implemented
- ActivityBar (home page ticker) shows initial posts only — no live polling (by design, to reduce DB load)
