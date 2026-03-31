## ADDED Requirements

### Requirement: User posts query API
The system SHALL expose `GET /api/user/posts` returning the authenticated user's posts where `status != DELETED`, ordered by `createdAt DESC`. The endpoint SHALL support `page` (default 1) and `limit` (default 10) query params. Unauthenticated requests SHALL receive HTTP 401. Response format: `{ data: Post[], total: number, page: number, hasMore: boolean }`.

#### Scenario: Authenticated user fetches their posts
- **WHEN** `GET /api/user/posts` is called with a valid session
- **THEN** posts authored by that user (excluding DELETED) are returned paginated

#### Scenario: Pagination works correctly
- **WHEN** `GET /api/user/posts?page=2&limit=10` is called
- **THEN** the second page of 10 posts is returned with correct `hasMore` flag

### Requirement: User comments query API
The system SHALL expose `GET /api/user/comments` returning the authenticated user's comments ordered by `createdAt DESC`, with each comment including `post: { select: { id, content } }` for the parent post reference. Supports `page` and `limit`. Unauthenticated requests receive HTTP 401. Response: `{ data: CommentWithPost[], total: number, page: number, hasMore: boolean }`.

#### Scenario: Authenticated user fetches their comments
- **WHEN** `GET /api/user/comments` is called
- **THEN** comments are returned with parent post id and truncatable content

### Requirement: User likes query API
The system SHALL expose `GET /api/user/likes` returning Like records where `userId = currentUser.id`, ordered by `Like.createdAt DESC`, with each Like including the full Post (with author select: id, name, username, image). Supports `page` and `limit`. Response: `{ data: LikeWithPost[], total: number, page: number, hasMore: boolean }`.

#### Scenario: Authenticated user fetches liked posts
- **WHEN** `GET /api/user/likes` is called
- **THEN** liked posts are returned in descending like-time order with post and author details

### Requirement: User favorites query API
The system SHALL expose `GET /api/user/favorites` returning Favorite records where `userId = currentUser.id AND postId IS NOT NULL`, ordered by `Favorite.createdAt DESC`, with each Favorite including the full Post (with author select: id, name, username, image). Supports `page` and `limit`. Response: `{ data: FavoriteWithPost[], total: number, page: number, hasMore: boolean }`.

#### Scenario: Authenticated user fetches favorited posts
- **WHEN** `GET /api/user/favorites` is called
- **THEN** favorited posts are returned in descending favorite-time order with post and author details

### Requirement: Batch liked-posts status API
The system SHALL expose `GET /api/user/liked-posts` accepting a `ids` query param (comma-separated post IDs, max 50). If the user is authenticated it SHALL return a map `{ [postId]: true }` for each ID that has a corresponding Like record. Unauthenticated requests SHALL return an empty object `{}`. IDs exceeding 50 SHALL be silently truncated to 50.

#### Scenario: Authenticated user batch-checks liked status
- **WHEN** `GET /api/user/liked-posts?ids=id1,id2,id3` is called by an authenticated user
- **THEN** a map of `{ [postId]: true }` is returned for each post the user has liked; unlisted IDs are absent

#### Scenario: Unauthenticated batch check returns empty
- **WHEN** `GET /api/user/liked-posts?ids=id1,id2` is called without a session
- **THEN** `{}` is returned
