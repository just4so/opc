## ADDED Requirements

### Requirement: Migration script remaps old PostType values
The migration script `scripts/migrate-plaza.ts` SHALL remap existing Post records: DAILY→CHAT, DISCUSSION→CHAT, QUESTION→HELP, EXPERIENCE→SHARE, RESOURCE→SHARE. It SHALL print COUNT of each old type before migrating as a baseline.

#### Scenario: Pre-migration baseline printed
- **WHEN** migration script runs
- **THEN** output shows counts: DAILY:N EXPERIENCE:N QUESTION:N RESOURCE:N DISCUSSION:N

#### Scenario: All old type values are remapped
- **WHEN** migration script completes
- **THEN** no Post records have type values DAILY, EXPERIENCE, QUESTION, RESOURCE, or DISCUSSION

### Requirement: Migration script moves Project records to Post table
The script SHALL migrate all Project records where `contentType IN (DEMAND, COOPERATION)` to the Post table with the following mapping: `title=Project.name`, `content=Project.description (stripped HTML)`, `contentHtml=null`, `type=COLLAB`, `topics=[Project.category]`, `authorId=Project.ownerId`, `budgetMin/budgetMax/budgetType/deadline/skills/contactInfo/contactType` directly mapped, `likeCount/commentCount/viewCount/createdAt` preserved.

#### Scenario: All DEMAND/COOPERATION projects migrated
- **WHEN** migration script completes
- **THEN** Post table contains 22 additional records with type=COLLAB

#### Scenario: Post COUNT after migration matches expected total
- **WHEN** migration script completes and prints post-migration stats
- **THEN** new Post count = old Post count + 22

### Requirement: Migration script validates and reports results
After migration the script SHALL print the new COUNT of Posts by type and the remaining Project DEMAND/COOPERATION count (expected: 0 migrated).

#### Scenario: Post-migration report
- **WHEN** migration completes successfully
- **THEN** output shows CHAT:N HELP:N SHARE:N COLLAB:N and confirms migrated project count

### Requirement: Old PostType enum values removed after migration
After the migration script is verified, the Prisma schema SHALL have the old enum values (DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION) removed from PostType.

#### Scenario: Schema contains only new enum values
- **WHEN** schema is viewed post-migration
- **THEN** PostType enum has exactly 4 values: CHAT, HELP, SHARE, COLLAB
