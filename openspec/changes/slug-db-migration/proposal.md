## Why

Community URLs currently use Chinese slugs (e.g., `/communities/北京-某某空间`), which cause encoding issues in browsers, analytics tools, and social sharing. Story 1 introduced a pinyin slug library (`lib/slug.ts`). This change migrates existing communities to pinyin slugs in the database and sets up 301 redirects so old Chinese URLs continue to work seamlessly.

## What Changes

- Add `newSlug` column (`String? @unique`) to the `Community` model in Prisma schema
- Create a migration script (`scripts/migrate-slugs.ts`) that batch-generates pinyin slugs for all communities using `generateUniqueSlug` and writes them to `newSlug`
- Add an API route (`/api/communities/slug-redirect`) that looks up a community by its old Chinese slug and returns the corresponding `newSlug`
- Update `middleware.ts` to intercept `/communities/:slug` requests — if the slug contains Chinese characters, call the redirect API and issue a 301 redirect to the new pinyin slug URL

## Capabilities

### New Capabilities
- `slug-migration`: Batch migration script to generate and persist pinyin slugs for all existing communities
- `slug-redirect`: API route and middleware logic to 301 redirect old Chinese slug URLs to new pinyin slug URLs

### Modified Capabilities
- `pinyin-slug`: No spec-level requirement changes — the existing `generateUniqueSlug` function is consumed as-is

## Impact

- **Database**: New nullable unique column `newSlug` on `Community` table; requires `prisma db push` + `prisma generate`
- **Prisma schema**: `prisma/schema.prisma` — one field addition
- **Scripts**: New `scripts/migrate-slugs.ts` — one-time migration script
- **API routes**: New `app/api/communities/slug-redirect/route.ts`
- **Middleware**: `middleware.ts` — add redirect logic for Chinese community slugs
- **SEO**: 301 redirects preserve link equity from old URLs; search engines will update their indexes over time
