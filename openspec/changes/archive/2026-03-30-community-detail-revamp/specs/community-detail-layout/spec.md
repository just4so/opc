## MODIFIED Requirements

### Requirement: Community detail page uses three-layer information architecture
The community detail page SHALL organize content into three layers reflecting user decision flow, replacing the current flat equal-weight card layout.

**Layer 1 — Quick Judgment (always visible, above the fold):**
- Hero section: cover image (if available), community name, city/district, type badge, featured badge
- 3 stat chips: workstations count / space size / apply difficulty stars
- `suitableFor` tags as a compact tag list
- First sentence of `description` as a tagline

**Layer 2 — Deep Dive (login required):**
Main column content in order:
1. Entry Policies (`policies`) — rendered from `CommunityPolicies` structure
2. Entry Process (`entryProcess`) — numbered steps
3. Real Intel (`realTips`) — visually distinct callout cards
4. Supporting Services (`services`) — tag list

Sidebar:
- CTA card: register prompt for guests, bookmark button for logged-in users
- Map + address
- Contact info (operator, contactName, contactWechat, contactPhone, website)

**Layer 3 — Reference (end of page, always visible):**
- Full `description` rendered as Markdown
- Reference links
- Community reviews section

#### Scenario: Guest sees Layer 1 and Layer 3 only
- **WHEN** an unauthenticated user visits a community detail page
- **THEN** Layer 1 (hero + stat chips + suitableFor + tagline) SHALL be visible
- **AND** Layer 2 content SHALL be replaced with a login/register prompt
- **AND** Layer 3 (full description + links + reviews) SHALL be visible

#### Scenario: Logged-in user sees all layers
- **WHEN** an authenticated user visits a community detail page
- **THEN** all three layers SHALL be rendered in order

#### Scenario: Layer 2 content order matches spec
- **WHEN** a logged-in user views Layer 2
- **THEN** policies SHALL appear before entryProcess, entryProcess before realTips, realTips before services

#### Scenario: Stat chips show available data only
- **WHEN** `workstations`, `spaceSize`, or `applyDifficulty` is null/undefined for a community
- **THEN** the corresponding stat chip SHALL not be rendered (no empty placeholder)

#### Scenario: First sentence tagline is derived from description
- **WHEN** `description` is non-empty
- **THEN** the first sentence (up to first `.`, `。`, or 100 characters) SHALL appear as a tagline in Layer 1
