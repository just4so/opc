## 1. Hero Section Revamp

- [x] 1.1 Update h1 text to "选社区，少走半年弯路" and subtitle to "全国 {totalCommunities}+ 个 OPC 社区 · 精确到联系方式 · 免费注册查看" with emphasis styling on key phrases in `app/(main)/page.tsx`
- [x] 1.2 Update primary CTA button text to "找适合我的社区 →" (keep href="/communities") in `app/(main)/page.tsx`
- [x] 1.3 Update `HeroSessionLink` in `components/home/session-cta.tsx`: guest shows "免费注册" → `/register` (orange border, white bg); logged-in shows "进入广场" → `/plaza`

## 2. Scenario-Fork Section

- [x] 2.1 Add 3-column intent card section (找社区 / 已入驻 / 看政策) between Hero and ActivityBar in `app/(main)/page.tsx` — static server-rendered content with Search, Building2, FileText icons from Lucide

## 3. Stats Section Update

- [x] 3.1 Replace stats array items 3 and 4 with qualitative items ("免费注册" / "解锁联系方式" and "真实入驻" / "社区攻略") in `app/(main)/page.tsx`

## 4. Bottom CTA Overhaul

- [x] 4.1 Wrap the bottom CTA `<section>` in a server-side `{!session && (...)}` conditional in `app/(main)/page.tsx` (session already available from `auth()`)
- [x] 4.2 Replace bottom CTA content with benefit-list layout: title "注册后立即可以：", 4 checkmark items, "立即免费注册" button → `/register`, and "已有账号？登录" link → `/login`
- [x] 4.3 Update `CtaSessionLink` in `components/home/session-cta.tsx` or replace with inline link since the section is now guest-only

## 5. Verification

- [x] 5.1 Run `npm run build` to verify no TypeScript or build errors
