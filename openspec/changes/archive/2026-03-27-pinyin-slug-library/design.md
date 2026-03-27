## Context

Community URLs currently use slugs that may contain raw Chinese characters or are manually crafted. This causes double-encoding issues (e.g., `generateStaticParams` producing `%25E4%25B8%258A...` instead of `上海`). A centralized slug generation utility is needed to produce clean, deterministic, pinyin-based slugs from Chinese city/name inputs.

The project already uses `lib/` for shared utilities (e.g., `lib/db.ts`, `lib/auth.ts`). The new utility follows this pattern.

## Goals / Non-Goals

**Goals:**
- Provide a single source of truth for slug generation from Chinese text
- Handle mixed Chinese/ASCII input (e.g., `虹橋opc社区` → `hongjiao-opc-shequ`)
- Ensure slug uniqueness via suffix numbering
- Detect Chinese characters in existing slugs for migration tooling

**Non-Goals:**
- Migrating existing community slugs (separate change)
- Integrating into admin forms or API routes (consumers will import as needed)
- Supporting languages other than Chinese + ASCII
- Slug validation or format enforcement at the database level

## Decisions

### Use `pinyin-pro` for Chinese-to-pinyin conversion
**Rationale**: `pinyin-pro` is the most actively maintained pinyin library, supports polyphonic characters (多音字) with context-aware disambiguation, and handles traditional/simplified Chinese. Alternatives like `pinyin` (hotoo) are less accurate and less maintained.

### Single file `lib/slug.ts` with pure functions
**Rationale**: The utility is small (3 exported functions) with no state or side effects. A single file keeps it simple and discoverable. No class or factory pattern needed.

### Max slug length of 60 characters with truncation at word boundary
**Rationale**: 60 chars is long enough for most city+name combinations but short enough for readable URLs. Truncation happens at the hyphen boundary to avoid cutting mid-word.

### Uniqueness via in-memory array comparison (not DB query)
**Rationale**: `generateUniqueSlug` accepts `existingSlugs: string[]` rather than querying the database directly. This keeps the utility pure and lets callers decide how to fetch existing slugs. For 104 communities, passing an array is trivial.

## Risks / Trade-offs

- **[Polyphonic characters]** → `pinyin-pro` handles most cases via context, but rare edge cases may produce unexpected pinyin. Mitigation: results can be manually overridden at the caller level.
- **[Bundle size]** → `pinyin-pro` adds ~2MB to node_modules. Mitigation: Only used server-side (lib/ utility), not shipped to the client bundle.
- **[Truncation]** → Very long names truncated to 60 chars may lose meaning. Mitigation: 60 chars accommodates the vast majority of community names; callers can override if needed.
