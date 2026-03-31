## Why

The current homepage functions as a feature menu — it lists what the platform has (community map, plaza, tools, etc.) but doesn't communicate *why* a visitor should register or what value they'll unlock. First-time visitors leave without understanding the core benefit: free access to detailed community contact info and entry requirements. Converting the homepage into a decision tool with clear action paths will improve registration conversion.

## What Changes

- **Hero section rewrite**: Replace generic motivational copy ("让 AI 创业者不再孤独前行") with benefit-driven headline ("选社区，少走半年弯路") and explicit value props ("精确到联系方式 · 免费注册查看"). Update CTAs to be intent-specific (find community vs. register/plaza).
- **New scenario-fork section**: Add 3-column card section between Hero and ActivityBar, routing users by intent — finding a community, using the plaza, or reading policy news.
- **Stats section revision**: Replace the last two stat items ("多城市免租工位" / "3年最长免租期") with qualitative value props ("免费注册 解锁联系方式" / "真实入驻 社区攻略").
- **Bottom CTA overhaul**: Replace generic CTA with a benefit-list section showing exactly what registration unlocks (4 specific benefits with checkmarks). Hide entirely for logged-in users.
- **Session-aware CTA updates**: Modify `HeroSessionLink` and `CtaSessionLink` components to reflect new copy and routing (register → `/register`, not `/start`).

## Capabilities

### New Capabilities

- `homepage-conversion-funnel`: Conversion-oriented homepage layout with benefit-driven hero, scenario-fork navigation cards, revised stats, and registration-focused bottom CTA with login-state awareness.

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **Files modified**: `app/(main)/page.tsx`, `components/home/session-cta.tsx`
- **No new dependencies**: Uses existing Lucide icons (Search, Building2, FileText) and Tailwind classes
- **No API changes**: All data already fetched (statsResult, recentPosts)
- **No schema changes**: No Prisma model modifications
- **Auth integration**: Existing `auth()` call in page.tsx provides session; existing client components already use `useSession()`
