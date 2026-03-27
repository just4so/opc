# admin-permissions Specification

## Purpose
TBD - created by archiving change admin-overhaul. Update Purpose after archive.
## Requirements
### Requirement: MODERATOR can access content management pages
The system SHALL allow users with MODERATOR role to access community management, news management, and market/orders management pages and APIs. Only user role management (changing roles) SHALL remain ADMIN-only.

#### Scenario: MODERATOR accesses community management
- **WHEN** a MODERATOR navigates to /admin/communities
- **THEN** the page loads successfully and shows the community list

#### Scenario: MODERATOR accesses news management
- **WHEN** a MODERATOR navigates to /admin/news
- **THEN** the page loads successfully and shows the news list

#### Scenario: MODERATOR cannot change user roles
- **WHEN** a MODERATOR views the user list at /admin/users
- **THEN** the role change dropdown/button SHALL NOT be visible

#### Scenario: ADMIN can change user roles
- **WHEN** an ADMIN views the user list at /admin/users
- **THEN** the role change dropdown SHALL be visible and functional

### Requirement: API permission levels match UI visibility
All admin content APIs (communities, news, posts, orders) SHALL use requireStaff() for access control. User role modification APIs SHALL use requireAdmin().

#### Scenario: MODERATOR calls community API
- **WHEN** a MODERATOR sends a request to /api/admin/communities
- **THEN** the API responds with 200 and returns data

#### Scenario: MODERATOR calls user role change API
- **WHEN** a MODERATOR sends a PATCH to /api/admin/users/[id] with role change
- **THEN** the API responds with 403 Forbidden

