## ADDED Requirements

### Requirement: PostCard like button has functional interaction
The `PostCard` component at `components/plaza/post-card.tsx` SHALL accept an optional `initialLiked?: boolean` prop (default `false`). The component SHALL maintain local `liked` (boolean) and `likeCount` (number) state initialized from `initialLiked` and the post's `likeCount`. Clicking the Heart button SHALL: (1) if unauthenticated, redirect to `/login`; (2) if authenticated, optimistically toggle `liked` and adjust `likeCount` by ±1, then call `POST /api/posts/[id]/like`, reverting on error.

#### Scenario: Unauthenticated user clicks like
- **WHEN** a user without a session clicks the Heart button on a PostCard
- **THEN** the user is redirected to `/login`

#### Scenario: Authenticated user likes a post
- **WHEN** an authenticated user clicks the Heart button on an unliked post
- **THEN** `liked` becomes true, likeCount increments by 1 optimistically, and `POST /api/posts/[id]/like` is called

#### Scenario: Authenticated user unlikes a post
- **WHEN** an authenticated user clicks the Heart button on an already-liked post
- **THEN** `liked` becomes false, likeCount decrements by 1 optimistically, and `POST /api/posts/[id]/like` is called

#### Scenario: Like API call fails
- **WHEN** the like API returns an error
- **THEN** the optimistic update is reverted (liked and likeCount return to previous values)

#### Scenario: PostCard renders with initial liked state
- **WHEN** `initialLiked={true}` is passed to PostCard
- **THEN** the Heart button renders in its liked/filled state

### Requirement: Plaza client batches liked-state on load
`components/plaza/plaza-client.tsx` SHALL, after the post list renders and only when the user is authenticated, call `GET /api/user/liked-posts?ids=<comma-separated-post-ids>` with the IDs of all currently displayed posts. The returned map SHALL be stored in state and passed to each PostCard as `initialLiked`. If the user is unauthenticated, all PostCards receive `initialLiked={false}`.

#### Scenario: Authenticated user sees correct like states on load
- **WHEN** an authenticated user views the plaza list
- **THEN** each PostCard's heart button reflects the user's actual like state for that post

#### Scenario: Unauthenticated user sees all hearts unfilled
- **WHEN** an unauthenticated user views the plaza list
- **THEN** all PostCard heart buttons are in the unliked state and no liked-posts API is called
