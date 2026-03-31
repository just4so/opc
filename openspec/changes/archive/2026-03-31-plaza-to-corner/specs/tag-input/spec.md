## ADDED Requirements

### Requirement: TagInput supports free-input tag creation
The TagInput component SHALL allow users to type a tag and create it by pressing Enter or comma. Tags SHALL be normalized to lowercase and trimmed before storing. The component SHALL accept a `maxTags` prop (default 5) and block creation when the limit is reached.

#### Scenario: Tag created on Enter
- **WHEN** user types a tag name and presses Enter
- **THEN** a new tag pill appears and the input clears

#### Scenario: Max tags limit enforced
- **WHEN** user has reached maxTags
- **THEN** input is disabled and a hint「最多N个标签」is shown

### Requirement: TagInput searches existing tags via API
As the user types, the component SHALL call `GET /api/tags/search?q=<input>` (debounced 300ms) and display a dropdown of matching existing tags ordered by frequency.

#### Scenario: Dropdown shows on input
- **WHEN** user types 1+ characters
- **THEN** a dropdown appears below the input with matching tag suggestions

#### Scenario: Clicking suggestion adds tag
- **WHEN** user clicks a tag in the dropdown
- **THEN** that tag is added to the selected list and the dropdown closes

### Requirement: GET /api/tags/search returns tags by frequency
The endpoint SHALL accept `q` query parameter and return matching tags aggregated from `Post.topics`, sorted by usage count descending, limited to 10 results.

#### Scenario: Search returns relevant tags
- **WHEN** GET /api/tags/search?q=创业
- **THEN** response is an array of strings matching「创业*」sorted by frequency

#### Scenario: Empty query returns top tags
- **WHEN** GET /api/tags/search?q= (empty)
- **THEN** response returns top 10 most-used tags overall
