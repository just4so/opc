## 1. Setup

- [x] 1.1 Install `pinyin-pro` dependency via `npm install pinyin-pro`

## 2. Core Implementation

- [x] 2.1 Create `lib/slug.ts` with `generateSlug(city, name)` function — convert Chinese to pinyin, normalize special chars to hyphens, collapse/trim hyphens, enforce 60-char max with hyphen-boundary truncation
- [x] 2.2 Add `generateUniqueSlug(city, name, existingSlugs)` function — call `generateSlug`, append `-2`, `-3`, etc. on collision
- [x] 2.3 Add `isChinese(slug)` function — return true if string contains CJK Unified Ideographs characters

## 3. Verification

- [x] 3.1 Verify the module compiles without errors (`npx tsc --noEmit lib/slug.ts` or build check)
- [x] 3.2 Manually test key scenarios: pure Chinese, mixed input, long input truncation, collision dedup, Chinese detection
