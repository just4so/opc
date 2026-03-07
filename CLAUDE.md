# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OPC创业圈 is a community platform for AI-era "One Person Company" entrepreneurs in China. It connects nationwide OPC communities with creators, providing community discovery, social features, collaboration marketplace, and AI model services.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production (runs prisma generate first)
npm run lint         # ESLint

# Database
npm run db:push      # Push schema changes to database
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed community data from Excel
npm run db:cleanup   # Clean duplicate communities
npm run db:verify    # Analyze/verify community data

# Content
npm run fetch:news   # Fetch news from RSS sources
```

## Architecture

### Tech Stack
- **Next.js 14** with App Router (not Pages Router)
- **Prisma** ORM with PostgreSQL (Supabase)
- **NextAuth.js v5** (beta) with credentials provider
- **TailwindCSS** + **shadcn/ui** components
- **Baidu Maps** WebGL API for community map

### Route Groups
```
src/app/
├── (auth)/          # Auth pages (login, register) - no main layout
├── (main)/          # Public pages with header/footer layout
├── admin/           # Admin panel (separate layout, role-protected)
└── api/             # API routes
```

### Key Patterns

**Authentication & Authorization:**
- `src/lib/auth.ts` - NextAuth configuration with JWT strategy
- `src/lib/admin.ts` - Role guards: `requireStaff()` (ADMIN/MODERATOR), `requireAdmin()` (ADMIN only)
- User roles: `USER`, `MODERATOR`, `ADMIN`
- MODERATOR can manage posts/orders; ADMIN can manage everything

**Database Access:**
- Import Prisma client from `@/lib/db` (not `@prisma/client`)
- Models: User, Community, Post, Project (orders), Comment, Like, News, Conversation, Message

**API Routes:**
- Public APIs return data directly
- Protected APIs check session via `auth()` from `@/lib/auth`
- Admin APIs use `requireStaff()` or `requireAdmin()` middleware

**Client Components:**
- Use `'use client'` directive for interactive components
- Wrap `useSearchParams()` in `<Suspense>` for static generation compatibility
- Session access via `useSession()` from `next-auth/react`

### Data Models

**Project (合作广场)** uses `contentType` enum:
- `DEMAND` - 需求订单 (looking for developers/designers)
- `COOPERATION` - 合作需求 (looking for partners)

**Community** key fields:
- `slug` - URL-friendly unique identifier
- `policies` - JSON for flexible policy storage
- `status`: ACTIVE, INACTIVE, PENDING

### UI Design System

Current theme (defined in `tailwind.config.ts`):
- Primary: Warm orange (#F97316)
- Secondary: Slate gray (#334155)
- Accent: Emerald (#10B981)

Glassmorphism effects in `globals.css`:
- `.glass`, `.glass-strong` - Frosted glass backgrounds
- `.shadow-soft` - Subtle elevation
- `.card-hover` - Lift on hover

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...     # For Prisma migrations
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
NEXT_PUBLIC_BMAP_KEY=...        # Baidu Maps
```

## Common Tasks

**Add new admin feature:**
1. Create API route in `src/app/api/admin/`
2. Use `requireStaff()` or `requireAdmin()` at route start
3. Create page in `src/app/admin/` (auto-protected by layout)

**Add new public page:**
1. Create in `src/app/(main)/your-page/page.tsx`
2. Inherits header/footer from `(main)/layout.tsx`

**Modify Prisma schema:**
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or create migration for production
3. Run `npm run db:generate` to update client
