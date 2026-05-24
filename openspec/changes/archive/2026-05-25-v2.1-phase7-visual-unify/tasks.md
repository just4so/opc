# V2.1 Phase 7: Visual Unify — DESIGN.md Semantic Token Migration

> Migrate all pages from old Tailwind utility classes (`text-gray-*`, `bg-white`, `border-gray-*`, etc.) to DESIGN.md semantic tokens (`text-ink`, `bg-canvas`, `border-hairline`, etc.).
>
> **Rule: NO functionality or layout changes. Only color/typography/border/shadow/rounded classes.**

## Token Mapping Reference

```
TEXT:
  text-gray-900 / text-slate-900         → text-ink
  text-gray-800                          → text-ink (headings) or text-charcoal (dark cards)
  text-gray-700 / text-slate-700         → text-body
  text-secondary (standalone)            → text-ink (headings) or text-body (body)
  text-gray-600 / text-slate-600         → text-mute
  text-gray-500 / text-slate-500         → text-mute
  text-gray-400 / text-slate-400         → text-ash
  text-gray-300                          → text-stone

BACKGROUND:
  bg-white (cards/modals/forms)          → bg-canvas
  bg-gray-50 / bg-slate-50              → bg-surface-soft
  bg-gray-100                           → bg-surface-card
  bg-gray-200                           → bg-secondary-bg

BORDER:
  border-gray-100                       → border-hairline-soft
  border-gray-200 / border-slate-200    → border-hairline-soft
  border-gray-300 / border-slate-300    → border-hairline
  ring-gray-100                         → ring-hairline-soft

DIVIDE:
  divide-gray-100                       → divide-hairline-soft
  divide-gray-200                       → divide-hairline-soft

HOVER:
  hover:bg-gray-50                      → hover:bg-surface-soft
  hover:bg-gray-100                     → hover:bg-surface-card
  hover:bg-gray-200                     → hover:bg-secondary-bg
  hover:text-gray-600                   → hover:text-mute
  hover:text-gray-800                   → hover:text-ink
  hover:text-gray-900                   → hover:text-ink
  hover:border-gray-300                 → hover:border-hairline

SHADOW:
  shadow-sm                             → shadow-soft
  shadow-md                             → shadow-soft
  shadow-lg (dropdowns)                 → shadow-soft-lg

ROUNDED:
  rounded-lg                            → rounded-2xl (maps to 16px per design system)
  rounded-xl                            → keep (close to 16px)
  rounded-2xl                           → keep

GRADIENT:
  from-slate-50                         → from-surface-soft
  to-white                              → to-canvas
```

---

## Batch 1: Layout & Shared Components (high impact, affects all pages)

### Task 1.1 — `app/(main)/layout.tsx` (header + footer)
- [ ] `border-gray-100` → `border-hairline-soft` (navbar border, footer border)
- [ ] `text-gray-500` → `text-mute` (nav links ×5, footer links)
- [ ] `hover:bg-gray-100` → `hover:bg-surface-card` (mobile menu button)
- [ ] `bg-white` → `bg-canvas` (footer background)
- [ ] `text-gray-400` → `text-ash` (footer secondary text ×3)

### Task 1.2 — `components/layout/user-nav.tsx`
- [ ] `bg-gray-200` → `bg-secondary-bg` (avatar placeholder)
- [ ] `text-gray-600` → `text-mute` (greeting text)
- [ ] `text-gray-700` → `text-body` (dropdown menu items ×3)
- [ ] `hover:bg-gray-100` → `hover:bg-surface-card` (dropdown items ×3)
- [ ] `bg-white` → `bg-canvas` (dropdown background)
- [ ] `shadow-lg` → `shadow-soft-lg` (dropdown shadow)
- [ ] `text-gray-900` → `text-ink` (user name)
- [ ] `text-gray-500` → `text-mute` (user email)

---

## Batch 2: Community Pages (highest traffic)

### Task 2.1 — `app/(main)/communities/[slug]/page.tsx` (~40 instances)
- [ ] `bg-white` → `bg-canvas` (back nav bar, header section, QR card container)
- [ ] `text-secondary` → `text-ink` (community name heading, login gate heading, entry requirements heading, register button text)
- [ ] `text-gray-600` → `text-mute` (back link, city/operator, benefits items, steps text, duration badge)
- [ ] `text-gray-700` → `text-body` (workstation/area chips, prose content, entry requirements, address, contact name, 政策支持 heading)
- [ ] `text-gray-500` → `text-mute` (tagline, login gate description, transit info, label text ×5)
- [ ] `text-gray-800` → `text-ink` (benefits section label, policy title, QR text)
- [ ] `text-gray-400` → `text-ash` (benefits small text, verified timestamp, icon colors ×6, policy summary, 查看全部 link)
- [ ] `bg-gray-100` → `bg-surface-card` (stat chips ×2, duration badge, amenities tags)
- [ ] `border-gray-300` → `border-hairline` (register button)
- [ ] `border-gray-100` → `border-hairline-soft` (benefits divider)
- [ ] `border-gray-50` → `border-hairline-soft` (policy list divider)
- [ ] `ring-gray-100` → `ring-hairline-soft` (QR code ring)
- [ ] `shadow-sm` → `shadow-soft` (login/register buttons, QR card)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (register button hover)
- [ ] `rounded-lg` → `rounded-2xl` (connect button)
- [ ] `to-white` → `to-canvas` (QR card gradient)

### Task 2.2 — `components/communities/communities-page-client.tsx` (~35 instances)
- [ ] `bg-white` → `bg-canvas` (sticky header, card backgrounds ×4)
- [ ] `text-gray-900` → `text-ink` (page title, card community names)
- [ ] `text-gray-800` → `text-ink` (tab labels, card text)
- [ ] `text-gray-500` → `text-mute` (empty state text, tab counts)
- [ ] `text-gray-400` → `text-ash` (search icon, placeholders, card secondary info ×5)
- [ ] `bg-gray-100` → `bg-surface-card` (skeleton loaders)
- [ ] `bg-gray-50` → `bg-surface-soft` (tag backgrounds)
- [ ] `border-gray-200` → `border-hairline-soft` (search input border)
- [ ] `border-gray-100` → `border-hairline-soft` (card borders)
- [ ] `shadow-sm` → `shadow-soft` (tabs, view toggle buttons ×4)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (card hover states ×2)
- [ ] `hover:text-gray-600` → `hover:text-mute` (clear button hover ×3)
- [ ] `hover:text-gray-800` → `hover:text-ink` (view toggle hover ×2)
- [ ] `rounded-lg` → `rounded-2xl` (search input, cards)
- [ ] `rounded-xl` → keep

---

## Batch 3: News Pages

### Task 3.1 — `app/(main)/news/page.tsx`
- [ ] `bg-white` → `bg-canvas` (skeleton card)
- [ ] `bg-gray-200` → `bg-secondary-bg` (skeleton shimmer elements ×4)
- [ ] `shadow-sm` → `shadow-soft` (skeleton card)
- [ ] `rounded-xl` → keep

### Task 3.2 — `app/(main)/news/[id]/page.tsx`
- [ ] `text-gray-500` → `text-mute` (back link, author info, date ×3)
- [ ] `text-gray-300` → `text-stone` (separator dots ×2)
- [ ] `text-gray-700` → `text-body` (category badge text, related news author, prose)
- [ ] `text-gray-900` → `text-ink` (article title)
- [ ] `bg-gray-100` → `bg-surface-card` (category badge, image placeholder)
- [ ] `border-gray-200` → `border-hairline-soft` (related news border)
- [ ] `rounded-lg` → `rounded-2xl` (related news link container)

---

## Batch 4: Plaza Pages

### Task 4.1 — `app/(main)/plaza/[id]/page.tsx`
- [ ] `bg-white` → `bg-canvas` (page container)
- [ ] `text-gray-600` → `text-mute` (back link, body text)
- [ ] `text-gray-500` → `text-mute` (metadata, date)
- [ ] `text-secondary` → `text-ink` (post title)
- [ ] `bg-gray-100` → `bg-surface-card` (image placeholder)
- [ ] `rounded-lg` → `rounded-2xl` (image container)

### Task 4.2 — `app/(main)/plaza/new/page.tsx` (~27 instances)
- [ ] `bg-gray-50` → `bg-surface-soft` (page background)
- [ ] `bg-gray-400` → `text-ash` (disabled state)
- [ ] `from-slate-50` → `from-surface-soft` (gradient)
- [ ] `to-white` → `to-canvas` (gradient)
- [ ] `bg-white` → `bg-canvas` (form card, type selection buttons ×3)
- [ ] `text-gray-900` → `text-ink` (page title)
- [ ] `text-slate-500` → `text-mute` (subtitle)
- [ ] `text-gray-700` → `text-body` (form labels ×8)
- [ ] `text-gray-600` → `text-mute` (type button text, helper text)
- [ ] `text-gray-400` → `text-ash` (placeholders ×4)
- [ ] `bg-slate-50` → `bg-surface-soft` (info box)
- [ ] `text-slate-700` → `text-body` (info box text)
- [ ] `border-slate-200` → `border-hairline-soft` (info box border)
- [ ] `border-gray-200` → `border-hairline-soft` (type buttons, topic buttons)
- [ ] `hover:border-gray-300` → `hover:border-hairline` (type button hover)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (type button hover)
- [ ] `shadow-sm` → `shadow-soft` (form card, submit button)
- [ ] `rounded-lg` → `rounded-2xl` (type buttons, topic buttons ×2)

---

## Batch 5: Static Pages

### Task 5.1 — `app/(main)/about/page.tsx`
- [ ] `text-secondary` → `text-ink` (section headings ×5)
- [ ] `text-gray-600` → `text-mute` (body paragraphs ×4)
- [ ] `border-gray-300` → `border-hairline` (back link border)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (back link hover)

### Task 5.2 — `app/(main)/privacy/page.tsx`
- [ ] `text-secondary` → `text-ink` (section headings ×9)
- [ ] `bg-white` → `bg-canvas` (content card)
- [ ] `text-gray-500` → `text-mute` (effective date)
- [ ] `text-gray-600` → `text-mute` (body text)
- [ ] `shadow-sm` → `shadow-soft` (content card)
- [ ] `rounded-xl` → keep

### Task 5.3 — `app/(main)/contact/page.tsx`
- [ ] `text-secondary` → `text-ink` (section headings ×5)
- [ ] `bg-white` → `bg-canvas` (content card)
- [ ] `text-gray-600` → `text-mute` (body text ×4)
- [ ] `text-gray-400` → `text-ash` (icon colors)
- [ ] `bg-gray-50` → `bg-surface-soft` (info box, QR section)
- [ ] `border-gray-100` → `border-hairline-soft` (QR section border)
- [ ] `shadow-sm` → `shadow-soft` (content card)
- [ ] `rounded-lg` → `rounded-2xl` (info box, QR image)
- [ ] `rounded-xl` → keep

---

## Batch 6: Auth Pages

### Task 6.1 — `app/(auth)/login/page.tsx`
- [ ] `bg-gray-50` → `bg-surface-soft` (page background)
- [ ] `text-gray-700` → `text-body` (form labels ×2)
- [ ] `text-gray-500` → `text-mute` (helper text)
- [ ] `text-gray-600` → `text-mute` (footer text)

### Task 6.2 — `app/(auth)/register/page.tsx` (~16 instances)
- [ ] `bg-gray-50` → `bg-surface-soft` (page background)
- [ ] `text-gray-700` → `text-body` (form labels ×7)
- [ ] `text-gray-400` → `text-ash` (placeholders ×2)
- [ ] `text-gray-500` → `text-mute` (helper text)
- [ ] `text-gray-600` → `text-mute` (option text, footer text ×2)
- [ ] `border-gray-200` → `border-hairline-soft` (stage/track buttons ×2)
- [ ] `hover:border-gray-300` → `hover:border-hairline` (button hover ×2)

---

## Batch 7: Messages Pages

### Task 7.1 — `app/(main)/messages/page.tsx` (~15 instances)
- [ ] `bg-white` → `bg-canvas` (skeleton card, empty state, conversation list ×3)
- [ ] `bg-gray-200` → `bg-secondary-bg` (skeleton avatar, shimmer elements ×2)
- [ ] `text-gray-300` → `text-stone` (empty state icon)
- [ ] `text-gray-500` → `text-mute` (empty state text, message preview)
- [ ] `text-gray-400` → `text-ash` (empty state subtext, timestamp)
- [ ] `text-gray-900` → `text-ink` (conversation partner name)
- [ ] `text-gray-700` → `text-body` (message preview, unread)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (conversation row hover)
- [ ] `rounded-lg` → `rounded-2xl` (cards ×3)

### Task 7.2 — `app/(main)/messages/[id]/page.tsx` (~11 instances)
- [ ] `bg-white` → `bg-canvas` (skeleton, message container ×2)
- [ ] `bg-gray-200` → `bg-secondary-bg` (skeleton elements ×2)
- [ ] `bg-gray-100` → `bg-surface-card` (received message bubble)
- [ ] `text-gray-800` → `text-ink` (received message text)
- [ ] `text-gray-600` → `text-mute` (partner name)
- [ ] `text-gray-400` → `text-ash` (timestamps ×2)
- [ ] `border-gray-200` → `border-hairline-soft` (input border)
- [ ] `rounded-lg` → `rounded-2xl` (cards, bubbles, input ×4)

---

## Batch 8: Search Page

### Task 8.1 — `app/(main)/search/page.tsx` (~25 instances)
- [ ] `bg-white` → `bg-canvas` (page container, results section ×2)
- [ ] `text-secondary` → `text-ink` (section headings, result titles ×8)
- [ ] `text-gray-400` → `text-ash` (search icon, empty state icon)
- [ ] `text-gray-500` → `text-mute` (result metadata, empty state text ×5)
- [ ] `text-gray-600` → `text-mute` (filter buttons, result descriptions ×3)
- [ ] `text-gray-700` → `text-body` (result links)
- [ ] `hover:text-gray-900` → `hover:text-ink` (result link hover)
- [ ] `hover:bg-gray-100` → `hover:bg-surface-card` (filter button hover)
- [ ] `hover:shadow-md` → `hover:shadow-soft` (result card hover ×3)
- [ ] `border-gray-200` → `border-hairline-soft` (search input, dividers ×2)
- [ ] `rounded-lg` → `rounded-2xl` (search input, result cards ×2)

---

## Batch 9: Utility Pages

### Task 9.1 — `app/(main)/tools/page.tsx`
- [ ] `text-secondary` → `text-ink` (headings ×2)
- [ ] `text-gray-500` → `text-mute` (descriptions ×2)
- [ ] `text-gray-600` → `text-mute` (tag text, card text)
- [ ] `bg-gray-100` → `bg-surface-card` (tags ×2)
- [ ] `hover:bg-gray-200` → `hover:bg-secondary-bg` (tag hover)
- [ ] `bg-white` → `bg-canvas` (card)
- [ ] `border-gray-100` → `border-hairline-soft` (card border)

### Task 9.2 — `app/(main)/data/page.tsx` (~39 instances)
- [ ] `bg-gray-50` → `bg-surface-soft` (page background, table header ×2)
- [ ] `bg-white` → `bg-canvas` (cards ×5, table rows)
- [ ] `text-gray-900` → `text-ink` (headings ×2)
- [ ] `text-gray-800` → `text-ink` (stat numbers ×5, subheadings)
- [ ] `text-gray-700` → `text-body` (detail text)
- [ ] `text-gray-600` → `text-mute` (stat labels ×8, descriptions)
- [ ] `text-gray-500` → `text-mute` (subtitles ×2)
- [ ] `text-gray-400` → `text-ash` (empty/placeholder text ×3)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (table row hover)

### Task 9.3 — `app/(main)/models/page.tsx`
- [ ] `bg-white` → `bg-canvas` (page container, model card)
- [ ] `text-secondary` → `text-ink` (heading)
- [ ] `text-gray-600` → `text-mute` (description, filter text ×2)
- [ ] `text-gray-500` → `text-mute` (subtitle)
- [ ] `hover:bg-gray-100` → `hover:bg-surface-card` (filter hover)

### Task 9.4 — `app/(main)/faq/page.tsx`
- [ ] `bg-gray-50` → `bg-surface-soft` (page background)
- [ ] `bg-white` → `bg-canvas` (FAQ card, category card ×2)
- [ ] `text-gray-900` → `text-ink` (question titles ×2)
- [ ] `text-gray-800` → `text-ink` (category heading)
- [ ] `text-gray-700` → `text-body` (answer text)
- [ ] `text-gray-600` → `text-mute` (answer summary)
- [ ] `text-gray-500` → `text-mute` (subtitle)

---

## Batch 10: Admin — Core Layout

### Task 10.1 — `app/admin/layout.tsx`
- [ ] `bg-gray-100` → `bg-surface-soft` (admin body background)
- [ ] `bg-white` → `bg-canvas` (sidebar, main content area)
- [ ] `text-gray-600` → `text-mute` (sidebar user info)
- [ ] `text-secondary` → `text-ink` (sidebar heading)

### Task 10.2 — `app/admin/admin-sidebar.tsx`
- [ ] `rounded-lg` → `rounded-2xl` (sidebar container)
- [ ] `text-gray-600` → `text-mute` (inactive nav items)
- [ ] `hover:bg-gray-100` → `hover:bg-surface-card` (nav item hover)
- [ ] `text-gray-400` → `text-ash` (section dividers/labels)

### Task 10.3 — `app/admin/page.tsx` (dashboard)
- [ ] `text-gray-500` → `text-mute` (stat labels, chart labels)
- [ ] `text-gray-400` → `text-ash` (secondary info)
- [ ] `text-secondary` → `text-ink` (section heading)
- [ ] `bg-gray-50` → `bg-surface-soft` (stat card backgrounds ×4)
- [ ] `hover:bg-gray-100` → `hover:bg-surface-card` (stat card hover ×4)
- [ ] `rounded-lg` → `rounded-2xl` (stat cards)

---

## Batch 11: Admin — Communities

### Task 11.1 — `app/admin/communities/communities-client.tsx` (~65 instances)
- [ ] `text-gray-*` → semantic tokens (various: 500→mute, 600→mute, 700→body, 800→ink, 900→ink)
- [ ] `bg-gray-50` → `bg-surface-soft` (alternating rows, section backgrounds)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (table row hover)
- [ ] `border-gray-200` → `border-hairline-soft` (table borders, card borders)
- [ ] `rounded-lg` → `rounded-2xl` (cards, table container)
- [ ] `text-secondary` → `text-ink` (headings)
- [ ] Keep functional status colors (green/red/yellow for ACTIVE/INACTIVE/PENDING)

### Task 11.2 — `app/admin/communities/community-form.tsx` (~100 instances)
- [ ] `text-gray-300` → `text-stone` (disabled text)
- [ ] `text-gray-400` → `text-ash` (placeholders, hints)
- [ ] `text-gray-500` → `text-mute` (helper text)
- [ ] `text-gray-600` → `text-mute` (descriptions)
- [ ] `text-gray-700` → `text-body` (form labels)
- [ ] `text-gray-900` → `text-ink` (section titles)
- [ ] `bg-gray-50` → `bg-surface-soft` (section backgrounds)
- [ ] `bg-gray-100` → `bg-surface-card` (tag backgrounds)
- [ ] `border-gray-100` → `border-hairline-soft` (light dividers)
- [ ] `border-gray-200` → `border-hairline-soft` (input borders)
- [ ] `border-gray-300` → `border-hairline` (stronger borders)
- [ ] `rounded-lg` → `rounded-2xl` (form sections)

### Task 11.3 — `app/admin/communities/[id]/page.tsx`
- [ ] `text-secondary` → `text-ink` (heading)
- [ ] `text-gray-500` → `text-mute` (labels)
- [ ] `text-gray-800` → `text-ink` (values)
- [ ] `bg-gray-100` → `bg-surface-card` (detail badges)
- [ ] `bg-gray-50` → `bg-surface-soft` (section background)
- [ ] `rounded-lg` → `rounded-2xl` (cards)

### Task 11.4 — `app/admin/communities/[id]/edit/page.tsx` + `app/admin/communities/new/page.tsx`
- [ ] `text-secondary` → `text-ink` (page titles)

---

## Batch 12: Admin — News

### Task 12.1 — `app/admin/news/page.tsx` (~40 instances)
- [ ] `text-gray-*` → semantic tokens (400→ash, 500→mute, 600→mute, 700→body, 800→ink)
- [ ] `bg-gray-50` → `bg-surface-soft` (backgrounds)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (row hover)
- [ ] `border-gray-200` → `border-hairline-soft` (borders)
- [ ] `rounded-lg` → `rounded-2xl` (cards)
- [ ] `text-secondary` → `text-ink` (headings)

### Task 12.2 — `app/admin/news/new/page.tsx` (~35 instances)
- [ ] `text-gray-*` → semantic tokens (form labels, hints, placeholders)
- [ ] `bg-white` → `bg-canvas` (form backgrounds)
- [ ] `border-gray-200` → `border-hairline-soft` (input borders)
- [ ] `rounded-lg` → `rounded-2xl` (form sections)
- [ ] `text-secondary` → `text-ink` (page title)

### Task 12.3 — `app/admin/news/[id]/edit/page.tsx` (~35 instances)
- [ ] Same pattern as Task 12.2
- [ ] `text-secondary` → `text-ink` (page title)

---

## Batch 13: Admin — Users

### Task 13.1 — `app/admin/users/users-client.tsx` (~45 instances)
- [ ] `text-gray-*` → semantic tokens (various shades)
- [ ] `bg-gray-100` → `bg-surface-card` (badges, tags)
- [ ] `bg-gray-50` → `bg-surface-soft` (backgrounds)
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft` (row hover)
- [ ] `border-gray-200` → `border-hairline-soft` (table borders)
- [ ] `rounded-lg` → `rounded-2xl` (cards)
- [ ] `text-secondary` → `text-ink` (headings)

### Task 13.2 — `app/admin/users/[id]/page.tsx` (~30 instances)
- [ ] `text-gray-*` → semantic tokens
- [ ] `border-*` → `border-hairline-soft`
- [ ] `rounded-lg` → `rounded-2xl`

---

## Batch 14: Admin — Orders, Policies, Inquiries, Verify

### Task 14.1 — `app/admin/orders/page.tsx` (~40 instances)
- [ ] `text-gray-*` → semantic tokens
- [ ] `bg-gray-100` / `bg-gray-50` → `bg-surface-card` / `bg-surface-soft`
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft`
- [ ] `border-gray-200` → `border-hairline-soft`
- [ ] `rounded-lg` → `rounded-2xl`
- [ ] `text-secondary` → `text-ink`

### Task 14.2 — `app/admin/policies/policies-client.tsx` (~35 instances)
- [ ] `text-gray-*` → semantic tokens
- [ ] `bg-gray-100` / `bg-gray-50` → `bg-surface-card` / `bg-surface-soft`
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft`
- [ ] `border-gray-200` → `border-hairline-soft`
- [ ] `rounded-lg` → `rounded-2xl`

### Task 14.3 — `app/admin/policies/policy-form.tsx` (~35 instances)
- [ ] `text-gray-*` → semantic tokens (labels, hints)
- [ ] `border-gray-200` → `border-hairline-soft` (input borders)
- [ ] `rounded-lg` → `rounded-2xl`

### Task 14.4 — `app/admin/policies/new/page.tsx` + `app/admin/policies/[id]/edit/page.tsx`
- [ ] `text-secondary` → `text-ink` (page titles)

### Task 14.5 — `app/admin/inquiries/inquiries-client.tsx` (~40 instances)
- [ ] `bg-white` → `bg-canvas` (card backgrounds)
- [ ] `text-gray-*` → semantic tokens
- [ ] `bg-gray-100` / `bg-gray-50` → `bg-surface-card` / `bg-surface-soft`
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft`
- [ ] `border-gray-200` → `border-hairline-soft`
- [ ] `rounded-lg` → `rounded-2xl`
- [ ] Keep status badge colors (badge-pending, badge-contacted, badge-done, badge-cancelled)

### Task 14.6 — `app/admin/inquiries/page.tsx` + `app/admin/verify/page.tsx`
- [ ] `text-gray-800` → `text-ink` (page titles)

### Task 14.7 — `app/admin/verify/verify-client.tsx` (~35 instances)
- [ ] `bg-white` → `bg-canvas` (card backgrounds)
- [ ] `text-gray-*` → semantic tokens
- [ ] `bg-gray-100` / `bg-gray-50` → `bg-surface-card` / `bg-surface-soft`
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft`
- [ ] `border-gray-200` → `border-hairline-soft`
- [ ] `rounded-lg` → `rounded-2xl`

---

## Batch 15: Admin — Radar & Settings

### Task 15.1 — `app/admin/radar/page.tsx` (~50 instances)
- [ ] `text-gray-*` → semantic tokens
- [ ] `bg-gray-50` → `bg-surface-soft`
- [ ] `hover:bg-gray-50` → `hover:bg-surface-soft`
- [ ] `border-gray-200` → `border-hairline-soft`
- [ ] `border-gray-300` → `border-hairline`
- [ ] `rounded-lg` → `rounded-2xl`
- [ ] `rounded` (bare) → `rounded-ds-sm` (8px) where it's on small elements

### Task 15.2 — `app/admin/radar/issues/[id]/edit/page.tsx` (~20 instances)
- [ ] `text-gray-*` → semantic tokens
- [ ] `bg-gray-50` → `bg-surface-soft`
- [ ] `border-gray-200` → `border-hairline-soft`
- [ ] `border-gray-300` → `border-hairline`

### Task 15.3 — `app/admin/settings/page.tsx`
- [ ] `text-gray-*` → semantic tokens
- [ ] `text-secondary` → `text-ink` (heading)

---

## Batch 16: Build Verification

### Task 16.1 — Build & Lint
- [ ] Run `npm run build` — must pass with zero errors
- [ ] Run `npm run lint` — no new warnings from class changes
- [ ] Spot-check 3 pages in browser (community detail, plaza, admin dashboard) for visual regressions

---

## Execution Notes

1. **Process each batch as one commit** — easier to revert if something breaks.
2. **Do NOT touch** `components/ui/*` (shadcn primitives), `components/plaza/*`, `components/home/*`, `components/connect/*` — these already use DESIGN.md tokens from V2.
3. **Admin functional colors stay** — green for ACTIVE, red for errors, yellow for warnings. Only migrate neutral grays.
4. **`rounded-lg` → `rounded-2xl`** only when the element is a card, button, or container. Small inline badges that use `rounded-lg` can stay or go to `rounded-xl`.
5. **`text-secondary`** (the old `#334155` slate token) → `text-ink` for headings, `text-body` for body text. Context determines which.
6. **Total estimated changes: ~400+ class replacements across ~40 files.**
