## ADDED Requirements

### Requirement: Posts management accessible by MODERATOR
The post management pages and APIs SHALL use requireStaff() for access control, ensuring MODERATOR can manage posts. (Note: posts management already has full functionality — pin toggle, hide/show, delete, search, status filter. This spec only covers the permission adjustment if needed.)

#### Scenario: MODERATOR accesses post management
- **WHEN** a MODERATOR navigates to /admin/posts
- **THEN** the page loads with full management capabilities (search, filter, pin, hide, delete)

#### Scenario: MODERATOR pins a post via API
- **WHEN** a MODERATOR sends a PATCH to /api/admin/posts/[id] with pinned=true
- **THEN** the API responds with 200 and the post is pinned
