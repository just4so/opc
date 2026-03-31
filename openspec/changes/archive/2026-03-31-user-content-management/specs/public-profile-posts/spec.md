## ADDED Requirements

### Requirement: Public profile page displays user's recent posts
The Server Component at `app/(main)/profile/[username]/page.tsx` SHALL query the database for the 10 most recent posts where `authorId = user.id AND status = PUBLISHED`, ordered by `createdAt DESC`. This data SHALL be passed to the profile client component for rendering below the user info card.

#### Scenario: Profile page fetches recent posts server-side
- **WHEN** any visitor (authenticated or not) navigates to `/profile/[username]`
- **THEN** up to 10 recent published posts by that user are fetched via Prisma during SSR

#### Scenario: User with no posts shows empty state
- **WHEN** the target user has no published posts
- **THEN** the posts section renders an appropriate empty state message

### Requirement: Public profile client shows post list
`components/profile/profile-client.tsx` SHALL render a "TA的帖子" section below the user info card displaying post summary cards. Each card SHALL show title (if present), content truncated to ~80 characters, type badge, creation time, and be clickable to navigate to `/plaza/[postId]`. No action buttons (like, delete) SHALL appear on these cards.

#### Scenario: Post cards render below user info
- **WHEN** profile client receives a non-empty posts array
- **THEN** a "TA的帖子" heading appears followed by post summary cards

#### Scenario: Clicking a post card navigates to plaza post
- **WHEN** a visitor clicks a post card on the public profile
- **THEN** the browser navigates to `/plaza/[postId]`
