## MODIFIED Requirements

### Requirement: realTips consolidates both realTips and notes content
The community `realTips` field SHALL be the single source of truth for real insider tips. Content previously stored in `notes[]` SHALL be migrated into `realTips[]` before the `notes` field is removed.

#### Scenario: Migration script merges notes into realTips
- **WHEN** `scripts/migrate-notes.ts` is run against the database
- **THEN** each community's `notes[]` entries SHALL be appended to its `realTips[]` array
- **AND** exact duplicate strings SHALL be deduplicated (not added twice)
- **AND** communities with empty `notes[]` SHALL be unchanged

#### Scenario: Migration is idempotent
- **WHEN** `scripts/migrate-notes.ts` is run a second time
- **THEN** no duplicate entries SHALL be added to `realTips[]`

#### Scenario: Detail page renders only realTips
- **WHEN** a user views a community detail page after migration
- **THEN** only `realTips` SHALL be rendered in the Real Intel section
- **AND** no `notes` content SHALL appear separately
