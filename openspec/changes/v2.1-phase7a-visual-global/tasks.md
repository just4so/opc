# v2.1-phase7a-visual-global — Tasks

> Homepage visual redesign + global reusable components to match v3 mockup.
> Branch: `feat/v2-redesign`

---

## Task 1: Global ScrollReveal component

**File:** `components/ui/scroll-reveal.tsx`

Create a `'use client'` wrapper component using Intersection Observer.

- [ ] Create `components/ui/scroll-reveal.tsx` as a `'use client'` component
- [ ] Props: `children: ReactNode`, `delay?: number` (ms, maps to `transition-delay`), `className?: string`
- [ ] Use `useRef` + `useEffect` with `IntersectionObserver({ threshold: 0.2 })`
- [ ] Observer fires once only — call `observer.unobserve(el)` after first intersection
- [ ] Default style on the wrapper div: `opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease;`
- [ ] When visible, apply: `opacity: 1; transform: translateY(0);`
- [ ] If `delay` prop provided, set `transition-delay: ${delay}ms` as inline style
- [ ] Respect `prefers-reduced-motion: reduce` — skip animation entirely (render children visible immediately)
- [ ] Use `useState` for visibility state rather than direct DOM manipulation
- [ ] No external dependencies — pure React + browser IntersectionObserver API

**Acceptance:** `<ScrollReveal delay={200}>` wraps any element; element fades up on scroll into view; no animation if user prefers reduced motion.

---

## Task 2: Global CSS additions

**File:** `app/globals.css`

Add utility classes matching the v3 mockup's decoration patterns.

- [ ] `.glass-nav` — `background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
  - Keep existing `.glass-strong` for non-nav uses; `.glass-nav` is specifically the navbar style from v3 mockup
- [ ] `.glow` — base class for radial gradient glow decorations; `position: absolute; border-radius: 50%; pointer-events: none; filter: blur(40px);`
  - Children apply specific sizing/colors via inline styles or modifiers
- [ ] `.grid-pattern` — CSS grid-line background: `background-image: linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 80px 80px;`
  - Include `mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 30%, transparent 80%)` + `-webkit-mask-image`
  - `position: absolute; inset: 0; pointer-events: none;`
- [ ] `.grid-pattern-dark` — same as above but white lines: `rgba(255,255,255,0.04)`, size `60px 60px`
- [ ] `.gradient-text` — `background: linear-gradient(135deg, #F97316, #FB923C); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`
- [ ] `.gradient-text-warm` — variant: `linear-gradient(135deg, #F97316, #FDBA74)` (used for value card numbers)
- [ ] `.card-hover-border` — `border: 1px solid var(--hairline-soft, #e5e5e0); transition: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94); &:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: transparent; transform: translateY(-2px); }`
  - Note: existing `.card-hover` only does `translateY(-2px)`; this new class adds the full border+shadow pattern from v3
- [ ] `@keyframes countUp` — not needed as animation (count-up is JS-driven via requestAnimationFrame); skip this
- [ ] All color values must use CSS custom properties or Tailwind tokens where available (e.g., `var(--hairline-soft)` maps to the `hairline-soft` token in tailwind.config.ts)

**Acceptance:** Each class works standalone when applied to a div. `.glass-nav` produces frosted glass. `.grid-pattern` shows fading grid lines. `.gradient-text` makes text orange-gradient. `.card-hover-border` lifts card on hover with shadow.

---

## Task 3: Navigation upgrade

**Files:**
- `app/(main)/layout.tsx` — header element (the nav lives inline here, not in a separate header component)
- `components/layout/user-nav.tsx` — register button style change

### 3a. Glass nav effect

- [ ] In `app/(main)/layout.tsx`, replace `glass-strong` class on `<header>` with `glass-nav`
- [ ] Remove the hardcoded `border-b border-gray-100` — border will be controlled by scroll state (see 3c)

### 3b. Register button: orange → dark

- [ ] In `components/layout/user-nav.tsx`, change the register `<Link>` (currently `bg-primary text-white`) to `bg-ink text-on-dark` with `rounded-[10px] text-[13px] font-semibold px-5 py-2 hover:opacity-85 transition-opacity`
- [ ] This matches the v3 mockup's `.btn-register` style: dark background, not orange

### 3c. Scroll-aware border

- [ ] Extract the `<header>` into a new `'use client'` component `components/layout/main-header.tsx` (or add scroll logic inline)
  - Option: simplest approach is a thin client wrapper that only manages the scroll state, keeping layout.tsx as server component
- [ ] Listen to `window.scroll` (passive, throttled or via `requestAnimationFrame`) 
- [ ] When `scrollY > 50`, add `border-b border-hairline-soft` (or toggle a class); when at top, no bottom border
- [ ] The `glass-nav` background is always present; only the border toggles

**Acceptance:** Nav has frosted glass background at all scroll positions. Bottom border appears only after scrolling 50px. Register button is dark (ink), not orange.

---

## Task 4: Homepage rewrite

**File:** `app/(main)/page.tsx`

Rewrite the JSX to match v3 mockup section by section. **Keep all existing data fetching functions unchanged** (`getHomeStats`, `getLatestCreators`, `getLatestRadarIssue`, `getAuth`). Only change the returned JSX and imports.

### 4a. Hero section

- [ ] Outer wrapper: `relative overflow-hidden bg-canvas` with generous padding (`py-[120px] md:py-[120px]` desktop, smaller on mobile)
- [ ] Glow decorations: two absolute `div`s
  - Glow 1: `absolute -top-[120px] right-[15%] w-[500px] h-[500px] rounded-full` + inline style `background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0) 70%); filter: blur(40px);` + `pointer-events-none`
  - Glow 2: `absolute -bottom-[80px] left-[10%] w-[400px] h-[400px] rounded-full` + inline style for amber glow `rgba(251,191,36,0.08)` + `filter: blur(50px)` + `pointer-events-none`
- [ ] Grid pattern: `<div className="grid-pattern" />` (from Task 2 CSS)
- [ ] Content wrapper: `relative z-10 max-w-[720px] mx-auto text-center`
- [ ] Title: `text-[32px] md:text-[56px] font-extrabold text-ink leading-[1.1] tracking-tight mb-5`
  - First line: `OPC创业者，在这里`
  - Second line: `<span className="gradient-text">连接、让世界看见</span>` (from Task 2 CSS)
  - Use `<br />` between lines
- [ ] Subtitle: `text-[15px] md:text-[17px] text-mute mb-11 leading-relaxed` with `<br />` between the two lines
  - Line 1: `全国 {stats.total} 个 OPC 社区 · 覆盖 {stats.cityCount} 个城市`
  - Line 2: `真实信息人工核实，一键对接入驻`
- [ ] CTA row: `flex gap-3 justify-center mb-7`
  - Primary: `bg-primary text-on-primary px-9 py-3.5 rounded-xl text-[15px] font-semibold shadow-[0_4px_16px_rgba(249,115,22,0.3)] hover:bg-primary-pressed hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all`
  - Ghost: `bg-transparent text-ink border-[1.5px] border-hairline-soft px-9 py-3.5 rounded-xl text-[15px] font-semibold hover:bg-surface-soft hover:border-[#d0d0cb] transition-all`
- [ ] Explore link: `text-[13px] text-ash` with inner `<Link>` styled `text-mute border-b border-hairline-soft hover:text-ink hover:border-ink`
- [ ] Wrap hero content in `<ScrollReveal>` (from Task 1)

### 4b. Value section

- [ ] Outer: `py-20 px-4 md:px-12 max-w-[1100px] mx-auto`
- [ ] Section label: `text-xs font-semibold text-primary uppercase tracking-[1.5px] mb-3 text-center` — "为什么选择 OPC圈"
- [ ] Section heading: `text-[24px] md:text-[32px] font-bold text-ink text-center tracking-tight mb-12` — "三个动作，开启创业新阶段"
- [ ] Value grid wrapper: `grid grid-cols-1 md:grid-cols-3 gap-px bg-hairline-soft rounded-3xl overflow-hidden`
  - The `gap-px bg-hairline-soft` creates 1px visual separators between cards
- [ ] Each value card: `bg-canvas p-8 md:p-12 hover:bg-surface-soft transition-colors duration-300 cursor-pointer`
  - Number: `text-5xl font-extrabold tracking-tight gradient-text-warm leading-none mb-4` — values are `183` / `✓` / `∞` (use actual stats.total for first card if desired, or keep as design constant — mockup uses 183)
  - Title: `text-lg font-semibold text-ink mb-2.5 leading-snug`
  - Description: `text-sm text-mute leading-relaxed`
- [ ] Card 1 links to `/communities`, Card 2 to `/settings#card` or `/register`, Card 3 to `/plaza`
- [ ] Wrap each card in `<ScrollReveal delay={index * 100}>`

### 4c. Dark data section (NEW)

- [ ] Outer: `bg-surface-dark py-[100px] px-4 md:px-12 text-center relative overflow-hidden`
- [ ] Glow decoration: absolute centered div, `w-[600px] h-[300px] rounded-full` + inline style `background: radial-gradient(ellipse, rgba(249,115,22,0.08) 0%, transparent 70%); filter: blur(60px);` + `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none`
- [ ] Grid pattern: `<div className="grid-pattern-dark" />` (from Task 2 CSS)
- [ ] Content wrapper: `relative z-10`
- [ ] Data grid: `max-w-[800px] mx-auto grid grid-cols-3 gap-8`
- [ ] Each data item:
  - Number: `text-[40px] md:text-[64px] font-extrabold text-on-dark tracking-tight leading-none`
  - Label: `text-sm text-on-dark-mute mt-2`
- [ ] Use `<AnimatedCounter>` (from Task 5) for each number:
  - Item 1: target = `stats.total` (dynamic), suffix = none, label = "OPC 社区"
  - Item 2: target = `stats.cityCount` (dynamic), suffix = none, label = "覆盖城市"
  - Item 3: target = 1000, suffix = "+", label = "创业者"
- [ ] Tagline: `text-[15px] text-on-dark-mute mt-12 leading-relaxed` — "每一条社区信息都经过人工核实，不是爬虫，不是复制粘贴"
- [ ] Wrap data grid in `<ScrollReveal>`

### 4d. Creators section

- [ ] Outer: `py-20 px-4 md:px-12 max-w-[1100px] mx-auto`
- [ ] Section header: `flex justify-between items-baseline mb-8`
  - Title: `text-2xl font-bold text-ink tracking-tight` — "最新入驻的创业者"
  - Link: `text-[13px] text-mute hover:text-primary` — "查看全部 →"
- [ ] Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- [ ] Card style change: **border-based** instead of filled background
  - `border border-hairline-soft rounded-2xl p-6 bg-canvas card-hover-border` (from Task 2 CSS)
  - Remove existing `bg-surface-card` fill
- [ ] Avatar: gradient background `bg-gradient-to-br from-primary-soft to-[#FED7AA]` (matches `linear-gradient(135deg, #FFF7ED, #FED7AA)`) with primary text color for initial
- [ ] Verified badge: keep existing `bg-primary text-on-primary text-[10px] px-1.5 py-px rounded font-semibold`
- [ ] Wrap each card in `<ScrollReveal delay={index * 100}>`

### 4e. Radar section

- [ ] Outer: `pb-20 px-4 md:px-12 max-w-[1100px] mx-auto`
- [ ] Card style change: **border-based** like creators
  - `border border-hairline-soft rounded-2xl p-6 md:p-8 bg-canvas`
  - Remove existing `bg-surface-card` fill
- [ ] Keep existing content structure (issueNo, title, date, summary, items list)
- [ ] Radar item dots: `w-[5px] h-[5px] rounded-full bg-primary mt-[7px] shrink-0`
- [ ] Wrap in `<ScrollReveal>`

### 4f. Footer

- [ ] The footer lives in `app/(main)/layout.tsx`, not in page.tsx
- [ ] **Do not change the footer in this task** — footer visual update is separate scope
- [ ] Only verify token consistency (e.g., use `text-ash` instead of `text-gray-400` where applicable in footer — but this is low-priority and optional)

**Acceptance:** Homepage visually matches v3 mockup: gradient glows, grid pattern, gradient text, bordered cards, dark data section with animated counters. All sections scroll-reveal on entry. Existing data (stats, creators, radar) still renders correctly. Mobile responsive (single column on mobile, multi-column on desktop).

---

## Task 5: AnimatedCounter component

**File:** `components/ui/animated-counter.tsx`

- [ ] Create `components/ui/animated-counter.tsx` as a `'use client'` component
- [ ] Props: `target: number`, `suffix?: string` (e.g., "+"), `prefix?: string`, `duration?: number` (default 1500ms), `className?: string`
- [ ] Use `useRef` + `useEffect` with `IntersectionObserver({ threshold: 0.3 })` — fires once
- [ ] When visible, animate from `0` to `target` over `duration` ms using `requestAnimationFrame`
  - Use easeOutQuart or similar easing for natural deceleration
  - Round intermediate values to integers
  - Format numbers with comma separators (e.g., `1,000`) using `toLocaleString('en-US')` or manual formatting
- [ ] Display: `{prefix}{currentValue}{suffix}`
- [ ] Before animation triggers, show `0` (or `prefix + "0" + suffix`)
- [ ] Respect `prefers-reduced-motion` — show final value immediately without animation
- [ ] No external dependencies

**Acceptance:** `<AnimatedCounter target={183} />` shows "0" then animates to "183" when scrolled into view. `<AnimatedCounter target={1000} suffix="+" />` animates to "1,000+". Animation fires once. No animation if reduced motion preferred.

---

## Build verification

- [ ] `npm run build` completes with zero errors
- [ ] No TypeScript errors
- [ ] No unused imports or variables
- [ ] All new components properly exported
- [ ] Mobile responsive: hero text scales down, grids collapse to single column, data section stacks appropriately
- [ ] Existing pages (communities, plaza, news, radar) are NOT affected by global CSS additions
