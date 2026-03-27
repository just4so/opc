## ADDED Requirements

### Requirement: Generate pinyin slug from city and name
The system SHALL export a `generateSlug(city: string, name: string): string` function that converts Chinese city and name inputs into a lowercase, hyphen-separated pinyin slug in the format `{city-pinyin}-{name-pinyin}`.

The function SHALL:
- Convert Chinese characters to pinyin (without tone marks)
- Preserve ASCII alphanumeric characters as-is (lowercased)
- Replace spaces and special symbols with hyphens
- Collapse consecutive hyphens into a single hyphen
- Strip leading and trailing hyphens
- Truncate the result to a maximum of 60 characters, cutting at the nearest hyphen boundary

#### Scenario: Pure Chinese input
- **WHEN** `generateSlug("上海", "虹橋opc社区")` is called
- **THEN** the result SHALL be `"shanghai-hongjiao-opc-shequ"`

#### Scenario: Mixed Chinese and ASCII
- **WHEN** `generateSlug("北京", "AI创业者联盟")` is called
- **THEN** the result SHALL be `"beijing-ai-chuangyezhe-lianmeng"`

#### Scenario: Input with special characters
- **WHEN** `generateSlug("深圳", "前海（自贸区）创业社区")` is called
- **THEN** special characters like parentheses SHALL be replaced by hyphens and consecutive hyphens collapsed

#### Scenario: Long input exceeding 60 characters
- **WHEN** the resulting slug would exceed 60 characters
- **THEN** the slug SHALL be truncated to at most 60 characters at the nearest hyphen boundary (no trailing hyphen)

#### Scenario: Empty or whitespace input
- **WHEN** city or name is empty or contains only whitespace
- **THEN** the function SHALL return a slug using only the non-empty part, or an empty string if both are empty

### Requirement: Generate unique slug with deduplication
The system SHALL export a `generateUniqueSlug(city: string, name: string, existingSlugs: string[]): string` function that produces a slug guaranteed to not collide with any entry in `existingSlugs`.

The function SHALL:
- Call `generateSlug` to produce the base slug
- If the base slug does not exist in `existingSlugs`, return it as-is
- If it exists, append `-2`, then `-3`, etc., incrementing until a unique slug is found

#### Scenario: No collision
- **WHEN** `generateUniqueSlug("上海", "创业社区", [])` is called
- **THEN** the result SHALL be the base slug from `generateSlug`

#### Scenario: Single collision
- **WHEN** `generateUniqueSlug("上海", "创业社区", ["shanghai-chuangye-shequ"])` is called
- **THEN** the result SHALL be `"shanghai-chuangye-shequ-2"`

#### Scenario: Multiple collisions
- **WHEN** `generateUniqueSlug("上海", "创业社区", ["shanghai-chuangye-shequ", "shanghai-chuangye-shequ-2"])` is called
- **THEN** the result SHALL be `"shanghai-chuangye-shequ-3"`

### Requirement: Detect Chinese characters in slug
The system SHALL export an `isChinese(slug: string): boolean` function that returns `true` if the input string contains any Chinese (CJK Unified Ideographs) characters.

#### Scenario: Slug with Chinese characters
- **WHEN** `isChinese("上海-创业社区")` is called
- **THEN** the result SHALL be `true`

#### Scenario: Pure ASCII slug
- **WHEN** `isChinese("shanghai-chuangye-shequ")` is called
- **THEN** the result SHALL be `false`

#### Scenario: Empty string
- **WHEN** `isChinese("")` is called
- **THEN** the result SHALL be `false`
