## ADDED Requirements

### Requirement: Role change button only visible to ADMIN
On the user list page, the role change dropdown/control SHALL only be rendered when the current user's role is ADMIN. MODERATOR users SHALL see the user list but without role modification controls.

#### Scenario: ADMIN sees role change controls
- **WHEN** an ADMIN views /admin/users
- **THEN** each user row displays a role change dropdown

#### Scenario: MODERATOR does not see role change controls
- **WHEN** a MODERATOR views /admin/users
- **THEN** user rows do NOT display role change dropdowns

### Requirement: User detail page shows extended information
The user detail page (/admin/users/[id]) SHALL display additional user information: registration date (createdAt), mainTrack (业务方向), startupStage (创业阶段), total post count, and level.

#### Scenario: View user detail with full information
- **WHEN** a staff user navigates to /admin/users/[id]
- **THEN** the page shows the user's registration date, business track, startup stage, level, and total post count in addition to existing information

### Requirement: User management accessible by MODERATOR (read-only for roles)
The user list page SHALL be accessible by MODERATOR (using requireStaff), but role modification SHALL require ADMIN permission (checked both in UI and API).

#### Scenario: MODERATOR accesses user list
- **WHEN** a MODERATOR navigates to /admin/users
- **THEN** the page loads showing the user list without role change controls

#### Scenario: MODERATOR attempts role change via API
- **WHEN** a MODERATOR sends a PATCH to /api/admin/users/[id] with a role field
- **THEN** the API returns 403 Forbidden
