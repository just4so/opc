## ADDED Requirements

### Requirement: Post creation page with intent selection
The system SHALL provide `/plaza/new` with 4 large intent cards at the top: 💬聊聊/❓求助/📣分享/🤝找人. Each card SHALL include a one-line description. Selecting a card sets the post type and reveals the corresponding form fields.

#### Scenario: Intent card selection
- **WHEN** user clicks an intent card
- **THEN** the card appears selected, the form below shows fields appropriate for that post type

### Requirement: Common fields for all post types
All post types SHALL share: optional title field (plain text), Tiptap rich text editor for content, TagInput for topic tags (max 5).

#### Scenario: Title is optional
- **WHEN** user submits a post without entering a title
- **THEN** the post is created successfully with `title = null`

#### Scenario: Content is required
- **WHEN** user submits with empty Tiptap editor
- **THEN** form validation blocks submission with an error message

### Requirement: COLLAB post extra fields
When post type is COLLAB, the system SHALL additionally show: 预算类型 (面议NEGOTIABLE/固定FIXED/区间RANGE) with conditional min/max inputs for RANGE; 截止日期 (optional date picker); 所需技能标签 (free-input tags, max 10); 联系方式类型 (微信/邮件/电话) + 联系内容 (required for COLLAB).

#### Scenario: Budget type RANGE shows min/max inputs
- **WHEN** user selects budget type RANGE
- **THEN** budgetMin and budgetMax number inputs appear

#### Scenario: Contact info required for COLLAB
- **WHEN** user attempts to submit a COLLAB post without contactInfo
- **THEN** form validation blocks submission with an error message

### Requirement: POST /api/posts accepts new fields
The API SHALL accept `title`, `contentHtml`, `budgetMin`, `budgetMax`, `budgetType`, `deadline`, `skills`, `contactInfo`, `contactType` in the request body. The server SHALL strip HTML from `contentHtml` to populate `content` automatically; frontend MUST NOT send `content` separately.

#### Scenario: contentHtml is sanitized server-side before storage
- **WHEN** POST /api/posts is called with contentHtml containing disallowed tags (e.g. `<script>`)
- **THEN** stored `contentHtml` has all disallowed tags removed

#### Scenario: content field auto-generated
- **WHEN** POST /api/posts is called with contentHtml
- **THEN** `content` is stored as plain text derived from stripping HTML tags from contentHtml
