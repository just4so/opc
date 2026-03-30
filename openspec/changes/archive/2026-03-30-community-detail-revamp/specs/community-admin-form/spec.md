## MODIFIED Requirements

### Requirement: Admin community form uses 5-section layout
The admin community edit/create form SHALL be reorganized into exactly 5 semantically distinct sections, replacing the previous 6-section layout.

| Section | Fields |
|---------|--------|
| **A. Identity** | name, slug, city, district, type, focus (tags), suitableFor (tags), status, featured |
| **B. Location & Space** | address, latitude, longitude, spaceSize, workstations |
| **C. Contact & Media** | operator, contactName, contactWechat, contactPhone, website, coverImage, images, links |
| **D. Benefits & Process** | policies (structured sub-form per `CommunityPolicies`), services (TagInput), entryProcess (ArrayInput) |
| **E. Real Intel** | description (Markdown editor), realTips (ArrayInput), applyDifficulty (star rating), processTime, lastVerifiedAt |

#### Scenario: Form displays exactly 5 sections
- **WHEN** admin opens the community create or edit form
- **THEN** exactly 5 labeled sections SHALL be visible, matching the names above

#### Scenario: description field is in Section E
- **WHEN** admin views Section E (Real Intel)
- **THEN** the description Markdown editor SHALL appear in that section

#### Scenario: policies sub-form is in Section D
- **WHEN** admin views Section D (Benefits & Process)
- **THEN** the structured policies sub-form SHALL appear in that section

#### Scenario: notes field is absent from the form
- **WHEN** admin opens the community form (after notes migration is complete)
- **THEN** no `notes` field SHALL appear anywhere in the form
