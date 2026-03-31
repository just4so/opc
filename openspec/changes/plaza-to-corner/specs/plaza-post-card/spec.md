## ADDED Requirements

### Requirement: Post card shows type label with color coding
Each post card SHALL display a type label pill in the first line with distinct colors: CHAT=灰色, HELP=橙色, SHARE=绿色, COLLAB=蓝色.

#### Scenario: COLLAB card shows blue type label
- **WHEN** a post with type=COLLAB is rendered as a card
- **THEN** a blue「🤝找人」label pill is visible in the card header

### Requirement: Post card shows title when present
When a post has a non-null `title`, the card SHALL display it in a second line with bold font before the content preview.

#### Scenario: Card with title
- **WHEN** post.title is non-null
- **THEN** title appears bold on its own line above the content preview

#### Scenario: Card without title
- **WHEN** post.title is null
- **THEN** no title line is rendered, content preview appears directly after type/topic line

### Requirement: Post card content preview is plain text truncated
The card content preview SHALL show at most 100 characters of plain text. If `contentHtml` is present, preview is derived by stripping HTML. If only `content` exists, use it directly.

#### Scenario: HTML content stripped for preview
- **WHEN** post has contentHtml
- **THEN** preview text has no HTML tags and is ≤100 characters with ellipsis if truncated

### Requirement: COLLAB card shows budget and deadline
For COLLAB type posts, the card SHALL show an extra info row with budget summary and deadline (if set).

#### Scenario: COLLAB card budget display
- **WHEN** post.type = COLLAB and budgetType = NEGOTIABLE
- **THEN** card shows「预算：面议」

#### Scenario: COLLAB deadline display
- **WHEN** post.deadline is set
- **THEN** card shows deadline formatted as「截止：YYYY-MM-DD」

### Requirement: GET /api/posts returns new fields and supports new type filters
The GET /api/posts endpoint SHALL return `title`, `contentHtml`, `budgetMin`, `budgetMax`, `budgetType`, `deadline`, `skills`, `contactType` for each post. `contactInfo` SHALL be returned only when the requester is authenticated. The `type` filter parameter SHALL accept CHAT/HELP/SHARE/COLLAB values.

#### Scenario: contactInfo hidden for unauthenticated user
- **WHEN** GET /api/posts is called without a valid session
- **THEN** each post in the response has `contactInfo: null`

#### Scenario: type filter with new values
- **WHEN** GET /api/posts?type=COLLAB is called
- **THEN** only posts with type=COLLAB are returned
