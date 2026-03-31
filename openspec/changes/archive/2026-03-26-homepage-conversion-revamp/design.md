## Context

The homepage (`app/(main)/page.tsx`) is a Server Component that fetches community stats, recent posts, and news via Prisma, then renders a series of sections: Hero → ActivityBar → Stats → Case Studies → Feature Cards → Hot Cities → News → CTA. Session state is available server-side via `auth()` and client-side via `useSession()` in two small client components (`HeroSessionLink`, `CtaSessionLink` in `components/home/session-cta.tsx`).

The current homepage communicates platform features but not registration value. Visitors see a motivational tagline and generic feature cards without understanding what they gain by signing up.

## Goals / Non-Goals

**Goals:**
- Make the registration value proposition immediately visible in the first viewport
- Route visitors by intent (find community / use plaza / read policy) via clear navigation cards
- Show concrete benefits of registration in the bottom CTA (with exact list of unlocked features)
- Hide registration-focused CTA for already-logged-in users

**Non-Goals:**
- Changing the ActivityBar, Case Studies, Feature Cards, Hot Cities, or News sections
- Adding new API endpoints or data fetching
- Modifying authentication flow or registration page
- A/B testing infrastructure
- Mobile-specific layouts beyond existing responsive breakpoints

## Decisions

### 1. Server-side session check for bottom CTA visibility

Pass `session` from the `auth()` call (already present in page.tsx) as a prop to a client component that conditionally renders the bottom CTA. This avoids a flash of CTA content for logged-in users.

**Alternative considered**: Use `useSession()` client-side only — rejected because it causes a visible flash before session loads.

**Approach**: Pass `!!session` as a boolean prop (`isLoggedIn`) to a new or modified `CtaSessionLink` wrapper. The server component conditionally renders the entire bottom CTA section based on `session`.

### 2. Scenario-fork section as static server-rendered content

The 3-column intent cards are pure static content with no session dependency. Render them directly in the server component — no client component needed.

### 3. Modify existing session-cta.tsx components in place

Update `HeroSessionLink` to show "免费注册" (→ `/register`) for guests and "进入广场" (→ `/plaza`) for logged-in users. Update styling to match the new design (orange border, white background for guest CTA).

Update `CtaSessionLink` similarly — though the bottom CTA section itself will be conditionally rendered server-side, the button component can remain a client component for session-aware text.

### 4. Emphasize key subtitle phrases with styling

Use `<span className="text-secondary font-semibold">` or similar to highlight "精确到联系方式" and "免费注册查看" within the subtitle, keeping the rest in the existing `text-gray-600`.

## Risks / Trade-offs

- **Content change risk** → Low technical risk. All changes are copy/layout within a single page and one component file. No data model or API changes.
- **SEO impact** → The h1 change from "让 AI 创业者不再孤独前行" to "选社区，少走半年弯路" changes the primary heading. This is intentional — the new heading is more keyword-relevant for "OPC 社区" searches.
- **Session flash on bottom CTA** → Mitigated by server-side conditional rendering. The entire `<section>` is omitted from the HTML when `session` exists, so no client-side flash.
