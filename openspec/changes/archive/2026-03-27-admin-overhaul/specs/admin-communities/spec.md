## ADDED Requirements

### Requirement: Community list has edit button per row
The community list page SHALL display an "编辑" button on each row that navigates directly to the community edit page (/admin/communities/[id]/edit).

#### Scenario: Click edit button on community row
- **WHEN** a staff user clicks the "编辑" button on a community row
- **THEN** the browser navigates to /admin/communities/[id]/edit for that community

### Requirement: Community list has status quick toggle
The community list page SHALL display a status toggle button on each row that switches a community between ACTIVE and INACTIVE without navigating to the edit page. The list SHALL refresh automatically after the toggle.

#### Scenario: Toggle active community to inactive
- **WHEN** a staff user clicks the status toggle on an ACTIVE community
- **THEN** the community status changes to INACTIVE and the list refreshes

#### Scenario: Toggle inactive community to active
- **WHEN** a staff user clicks the status toggle on an INACTIVE community
- **THEN** the community status changes to ACTIVE and the list refreshes

### Requirement: Community management accessible by MODERATOR
The community management pages and APIs SHALL use requireStaff() instead of requireAdmin(), allowing MODERATOR access.

#### Scenario: MODERATOR accesses community list
- **WHEN** a MODERATOR navigates to /admin/communities
- **THEN** the page loads and shows the community list with full management capabilities
