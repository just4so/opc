# admin-news Specification

## Purpose
TBD - created by archiving change admin-overhaul. Update Purpose after archive.
## Requirements
### Requirement: News edit page exists
The system SHALL provide an edit page at /admin/news/[id]/edit that loads existing news data and allows editing all fields (title, category, author, content, publishDate).

#### Scenario: Navigate to news edit page
- **WHEN** a staff user navigates to /admin/news/[id]/edit
- **THEN** the page displays a form pre-filled with the existing news article data

#### Scenario: Submit edited news article
- **WHEN** a staff user modifies fields and submits the edit form
- **THEN** the system sends a PUT request to /api/admin/news/[id] and redirects to the news list on success

### Requirement: News list has edit button per row
The news list page SHALL display an "编辑" button on each row (for original articles) that navigates to /admin/news/[id]/edit.

#### Scenario: Click edit button on original news row
- **WHEN** a staff user clicks "编辑" on an original news article row
- **THEN** the browser navigates to /admin/news/[id]/edit

### Requirement: News PUT API supports full article update
The API at PUT /api/admin/news/[id] SHALL accept and update title, category, author, content, and publishedAt fields. It SHALL use requireStaff() for access control.

#### Scenario: Update news article via PUT API
- **WHEN** a PUT request is sent to /api/admin/news/[id] with updated fields
- **THEN** the news article is updated in the database and the API returns the updated article

#### Scenario: PUT request with missing required fields
- **WHEN** a PUT request is sent without a title
- **THEN** the API returns 400 with a validation error

### Requirement: News management accessible by MODERATOR
The news management pages and APIs SHALL use requireStaff() instead of requireAdmin().

#### Scenario: MODERATOR accesses news list
- **WHEN** a MODERATOR navigates to /admin/news
- **THEN** the page loads and shows the news list with edit and delete capabilities

