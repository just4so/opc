## Why

Community slugs are currently manually created or contain raw Chinese characters, causing URL encoding issues (double-encoded slugs, ugly `%E4%B8%8A%E6%B5%B7` in URLs). We need a consistent utility to convert Chinese city/name pairs into clean, readable pinyin-based slugs for community URLs and future content.

## What Changes

- Add `pinyin-pro` npm dependency for Chinese-to-pinyin conversion
- Create `lib/slug.ts` utility module exporting:
  - `generateSlug(city, name)` — converts Chinese city + name into a lowercase pinyin slug (e.g., `上海` + `虹橋opc社区` → `shanghai-hongjiao-opc-shequ`), max 60 chars
  - `generateUniqueSlug(city, name, existingSlugs)` — generates a slug and appends `-2`, `-3`, etc. if duplicates exist
  - `isChinese(slug)` — detects whether a slug contains Chinese characters (for migration use)

## Capabilities

### New Capabilities
- `pinyin-slug`: Pinyin-based slug generation from Chinese text, uniqueness handling, and Chinese character detection

### Modified Capabilities
<!-- None — this is a new standalone utility -->

## Impact

- **Dependencies**: Adds `pinyin-pro` package
- **Code**: New file `lib/slug.ts` — no existing code modified
- **Future use**: Will be consumed by community creation/migration flows and admin tools
