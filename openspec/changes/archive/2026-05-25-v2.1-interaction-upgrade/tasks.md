# V2.1 Interaction Upgrade — Tasks (P0 + P1)

> Spec: `docs/V2-INTERACTION-SPEC.md`
> Branch: `feat/v2-redesign`

---

## A. Hero entrance sequence (P0)

### A1. Add CSS @keyframes and delay classes to globals.css
- [ ] Add `--ease-out-expo`, `--ease-spring`, `--ease-subtle` CSS custom properties to `:root` in `app/globals.css`
- [ ] Add `@keyframes fadeInUp` animation (`from: opacity 0, translateY(24px)` → `to: opacity 1, translateY(0)`)
- [ ] Add `.hero-animate` class: `opacity: 0; animation: fadeInUp 0.6s var(--ease-out-expo) forwards;`
- [ ] Add `.hero-delay-1` through `.hero-delay-4` classes (200ms, 400ms, 600ms, 800ms)
- [ ] Add `@media (prefers-reduced-motion: reduce)` override: `.hero-animate { opacity: 1; animation: none; }`
- **Acceptance:** Hero keyframe and delay classes exist in globals.css; reduced-motion users see no animation

### A2. Apply hero animation classes to homepage
- [ ] In `app/(main)/page.tsx`, add `hero-animate` to the h1 first line wrapper
- [ ] Add `hero-animate hero-delay-1` to the `<span className="gradient-text-orange">` wrapper (may need a wrapping element)
- [ ] Add `hero-animate hero-delay-2` to the subtitle `<p>`
- [ ] Add `hero-animate hero-delay-3` to the buttons `<div>`
- [ ] Add `hero-animate hero-delay-4` to the "不确定？" `<p>`
- **Acceptance:** On homepage load, elements appear sequentially 200ms apart; no layout shift; `prefers-reduced-motion` shows everything instantly

---

## B. Card interaction upgrade (P0)

### B1. Update `.card-interactive` in globals.css
- [ ] Replace existing `.card-interactive` transition with: `border-color 0.25s var(--ease-subtle), box-shadow 0.25s var(--ease-subtle), transform 0.25s var(--ease-out-expo)`
- [ ] Update `.card-interactive:hover` to: `border-color: var(--hairline); box-shadow: 0 8px 30px rgba(0,0,0,0.06); transform: translateY(-2px);`
- [ ] Verify `--hairline` resolves to a valid color token (check `tailwind.config.ts` or DESIGN.md)
- **Acceptance:** All `.card-interactive` cards (creator cards, radar card on homepage, community cards elsewhere) show smooth border + shadow + lift on hover; no `transition: all` remains

### B2. Apply card-interactive class to value cards
- [ ] Add `card-interactive` class to the three value cards in the homepage 价值区 section (currently using inline border/hover styles)
- [ ] Remove the now-redundant inline hover styles (`hover:border-transparent hover:shadow-soft hover:-translate-y-1 transition-all duration-300`) from value cards
- **Acceptance:** Value cards use the same `.card-interactive` transition as creator/radar cards; no duplicate hover styles

---

## C. Button interaction (P0)

### C1. Add button interaction styles to globals.css
- [ ] Add `.btn-press` utility class with:
  - `transition: background-color 0.15s var(--ease-subtle), box-shadow 0.2s var(--ease-subtle), transform 0.1s var(--ease-spring);`
  - `:hover { filter: brightness(1.05); }`
  - `:active { transform: scale(0.98); }`
- [ ] Add `@media (prefers-reduced-motion: reduce)` override: `.btn-press:active { transform: none; }`
- **Acceptance:** Class exists, respects reduced-motion

### C2. Apply to homepage CTA buttons
- [ ] Add `btn-press` class to "找到我的社区" primary button in hero
- [ ] Add `btn-press` class to "让世界看见我" secondary button in hero
- **Acceptance:** Both hero buttons show brightness lift on hover and scale-down on click

### C3. Integrate into shadcn Button component
- [ ] In `components/ui/button.tsx`, add `btn-press` to the base `buttonVariants` class list (so all Button instances get the interaction)
- **Acceptance:** Any `<Button>` across the site gets press feedback; existing variant styles (destructive, ghost, etc.) still work

---

## D. ScrollReveal stagger (P1)

### D1. Add stagger support to ScrollReveal component
- [ ] Add `stagger?: boolean` and `staggerInterval?: number` (default 100) props to `ScrollRevealProps`
- [ ] When `stagger` is true, add CSS class `.sr-stagger` to the wrapper
- [ ] Add `.sr-stagger` CSS in globals.css that applies incremental `transition-delay` to direct children via `:nth-child(n)`:
  - `.sr-stagger.sr-visible > :nth-child(1) { transition-delay: 0ms; }`
  - `.sr-stagger.sr-visible > :nth-child(2) { transition-delay: 100ms; }`
  - `.sr-stagger.sr-visible > :nth-child(3) { transition-delay: 200ms; }` etc. (up to 6)
- [ ] Direct children should start with `opacity: 0; transform: translateY(16px);` and transition to visible when parent gets `.sr-visible`
- [ ] Respect `prefers-reduced-motion`: no delay, no transform
- **Acceptance:** Children of a staggered ScrollReveal animate in one-by-one; non-staggered ScrollReveal behavior unchanged

---

## E. Navigation scroll-aware (P1)

### E1. Create ScrollHeader client component
- [ ] Create `components/layout/scroll-header.tsx` ('use client')
- [ ] Use `useEffect` + scroll event listener (with passive flag) to detect `scrollY > 50`
- [ ] When not scrolled: header has `bg-transparent` and no `border-b`
- [ ] When scrolled: header gains `glass-nav border-b border-hairline-soft` classes
- [ ] Transition between states should be smooth (use CSS transition on background + border-color)
- [ ] Respect `prefers-reduced-motion`: skip transition, just snap

### E2. Integrate ScrollHeader into main layout
- [ ] In `app/(main)/layout.tsx`, replace the current `<header>` with `<ScrollHeader>`
- [ ] Move the header children (logo, nav, user actions) inside ScrollHeader
- [ ] The layout file itself stays a Server Component — only the header wrapper is 'use client'
- **Acceptance:** Header is transparent at page top, gains glass background + border on scroll > 50px; no flicker on initial load; footer and main content layout unchanged

---

## F. Value cards entrance (P1)

### F1. Apply ScrollReveal stagger to value cards section
- [ ] Wrap the 价值区 section label ("为什么选择 OPC圈") and heading in their own `<ScrollReveal>`
- [ ] Wrap the 3-card grid in `<ScrollReveal stagger>` so cards animate in 100ms apart
- [ ] Remove the outer `<ScrollReveal>` that currently wraps the entire section (replace with the more granular wrappers above)
- **Acceptance:** Section label and heading fade in first; then three cards rise up one-by-one with 100ms stagger; looks natural on scroll

### F2. Apply ScrollReveal stagger to creators section
- [ ] Wrap the creators 4-card grid in `<ScrollReveal stagger>` so creator cards animate in sequentially
- [ ] Keep the section heading + "查看全部" link in a separate `<ScrollReveal>` (no stagger)
- **Acceptance:** Heading appears first; then 4 creator cards rise up one-by-one

---

## Cross-cutting

### X1. Build verification
- [ ] `npm run build` passes with zero errors
- [ ] No TypeScript errors introduced
- [ ] No new dependencies added (pure CSS + minimal React)

### X2. Reduced motion audit
- [ ] All 6 tasks (A–F) have `prefers-reduced-motion: reduce` handling
- [ ] With reduced motion enabled: no animations play, all content visible immediately
