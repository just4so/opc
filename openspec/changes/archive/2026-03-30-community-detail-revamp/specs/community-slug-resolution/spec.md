## MODIFIED Requirements

### Requirement: newSlug is the canonical community URL identifier
The system SHALL treat `newSlug` as the canonical URL identifier for communities. `slug` SHALL be treated as a legacy read-only field used only as a fallback.

#### Scenario: URL generation uses newSlug
- **WHEN** any code constructs a community URL (detail page link, revalidatePath, etc.)
- **THEN** it SHALL use `community.newSlug ?? community.slug` as the slug segment

#### Scenario: Runtime warning when newSlug is null
- **WHEN** `community.newSlug` is null or undefined at runtime
- **THEN** the system SHALL log a `console.warn` identifying the community by `id` and `slug`

#### Scenario: getCommunity lookup accepts both slug values
- **WHEN** `getCommunity(slugParam)` is called with a slug value
- **THEN** it SHALL query `WHERE slug = slugParam OR newSlug = slugParam` to support both old and new URL formats

#### Scenario: No `newSlug || slug` logical OR pattern remains
- **WHEN** the codebase is reviewed after this change
- **THEN** the pattern `community.newSlug || community.slug` SHALL NOT appear (replaced by `??` operator)
