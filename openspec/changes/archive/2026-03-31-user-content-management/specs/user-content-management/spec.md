## ADDED Requirements

### Requirement: Profile page displays tabbed content management interface
The system SHALL transform `/app/(main)/profile/page.tsx` from a single resource card into a tabbed interface with four tabs: 我的帖子, 我的评论, 我的点赞, 我的收藏. The page SHALL remain a Client Component. Each tab SHALL load its data lazily on first activation via the corresponding `/api/user/*` API. Data fetched per tab SHALL be cached in component state so switching back does not re-request.

#### Scenario: User opens profile page
- **WHEN** an authenticated user navigates to `/profile`
- **THEN** the page renders with four tabs and the first tab (我的帖子) is active and its data loaded

#### Scenario: User switches to a tab for the first time
- **WHEN** the user clicks a tab that has not been visited yet
- **THEN** the system fetches data from the corresponding API and renders the results

#### Scenario: User switches back to a previously visited tab
- **WHEN** the user clicks a tab already visited in the current session
- **THEN** the cached data is shown immediately without making a new API request

### Requirement: 我的帖子 tab displays user posts with delete action
The 我的帖子 tab SHALL display posts where `authorId = currentUser.id AND status != DELETED`, ordered by `createdAt DESC`, paginated at 10 per page. Each post card SHALL show title (if present), content truncated to ~80 characters, type badge, creation time, likeCount, and commentCount. A "删除" button SHALL appear on each card. Clicking "删除" SHALL show `window.confirm`; on confirmation, call `DELETE /api/posts/[id]`; on success remove the post from the local list.

#### Scenario: Post list renders
- **WHEN** 我的帖子 tab loads
- **THEN** posts are shown in descending creation order with type badge and stats

#### Scenario: User deletes a post
- **WHEN** user clicks 删除 and confirms
- **THEN** `DELETE /api/posts/[id]` is called and the post disappears from the list without page reload

#### Scenario: User cancels delete
- **WHEN** user clicks 删除 and dismisses the confirm dialog
- **THEN** no API call is made and the post remains in the list

#### Scenario: Load more posts
- **WHEN** there are more than 10 posts and user clicks 加载更多
- **THEN** the next page of posts is appended to the list

### Requirement: 我的评论 tab displays user comments with delete action
The 我的评论 tab SHALL display comments where `authorId = currentUser.id`, ordered by `createdAt DESC`, paginated at 10 per page. Each item SHALL show the comment content, a "来自帖子：{post content truncated}" link that navigates to `/plaza/[postId]`, creation time, and a "删除" button. Clicking 删除 SHALL confirm via `window.confirm`, then call `DELETE /api/comments/[id]`, and on success remove from list.

#### Scenario: Comment list renders with post link
- **WHEN** 我的评论 tab loads
- **THEN** each comment shows its content and a link to the originating post

#### Scenario: User deletes a comment
- **WHEN** user clicks 删除 and confirms
- **THEN** `DELETE /api/comments/[id]` is called and the comment disappears from the list

### Requirement: 我的点赞 tab displays liked posts (read-only)
The 我的点赞 tab SHALL display posts the user has liked via `Like where userId = currentUser.id`, joined with Post, ordered by `Like.createdAt DESC`, paginated at 10 per page. Each post card is read-only (no action buttons). Clicking the card navigates to `/plaza/[postId]`.

#### Scenario: Liked posts list renders
- **WHEN** 我的点赞 tab loads
- **THEN** posts the user has liked are shown in descending like-time order, read-only

### Requirement: 我的收藏 tab displays favorited posts with unfavorite action
The 我的收藏 tab SHALL display posts the user has favorited via `Favorite where userId = currentUser.id`, joined with Post, ordered by `Favorite.createdAt DESC`, paginated at 10 per page. Each card SHALL show a "取消收藏" button. Clicking it SHALL confirm via `window.confirm`, then call `POST /api/posts/[id]/favorite` (toggle), and on success remove from list.

#### Scenario: Favorited posts list renders
- **WHEN** 我的收藏 tab loads
- **THEN** favorited posts are shown in descending favorite-time order

#### Scenario: User unfavorites a post
- **WHEN** user clicks 取消收藏 and confirms
- **THEN** the toggle API is called and the post disappears from the favorites list
