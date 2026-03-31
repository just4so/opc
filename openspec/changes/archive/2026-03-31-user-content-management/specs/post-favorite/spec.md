## ADDED Requirements

### Requirement: Post favorite toggle API
The system SHALL expose `POST /api/posts/[id]/favorite` that toggles the current user's favorite status for a post. If a `Favorite` record with `(userId, postId)` already exists it SHALL be deleted; otherwise a new record SHALL be created. The endpoint SHALL require authentication; unauthenticated requests SHALL receive HTTP 401. Non-existent posts SHALL receive HTTP 404. The response SHALL be `{ favorited: boolean }` reflecting the new state.

#### Scenario: User favorites a post
- **WHEN** authenticated user sends `POST /api/posts/[id]/favorite` and has not favorited the post
- **THEN** a Favorite record is created and `{ favorited: true }` is returned

#### Scenario: User unfavorites a post
- **WHEN** authenticated user sends `POST /api/posts/[id]/favorite` and has already favorited the post
- **THEN** the Favorite record is deleted and `{ favorited: false }` is returned

#### Scenario: Unauthenticated request is rejected
- **WHEN** `POST /api/posts/[id]/favorite` is called without a valid session
- **THEN** HTTP 401 is returned

### Requirement: Get favorite status API
The system SHALL expose `GET /api/posts/[id]/favorite` that returns the current user's favorite status for a post. Unauthenticated requests SHALL return `{ favorited: false }`.

#### Scenario: Authenticated user checks favorite status
- **WHEN** authenticated user sends `GET /api/posts/[id]/favorite`
- **THEN** `{ favorited: true }` or `{ favorited: false }` is returned based on whether a Favorite record exists

#### Scenario: Unauthenticated user checks favorite status
- **WHEN** unauthenticated request sends `GET /api/posts/[id]/favorite`
- **THEN** `{ favorited: false }` is returned
