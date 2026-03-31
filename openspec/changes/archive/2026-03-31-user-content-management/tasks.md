## 1. Database & Schema

- [x] 1.1 Verify `PostStatus.DELETED` exists in `prisma/schema.prisma` (already present — confirm and skip migration if so)
- [x] 1.2 Verify `Favorite` model has `@@unique([userId, postId])` constraint (already present — confirm)

## 2. Post Delete API

- [x] 2.1 Create `app/api/posts/[id]/route.ts` with `DELETE` handler: auth check (401), post lookup (404), ownership/role check (403), soft-delete `status = DELETED`, call `revalidatePath`, return `{ success: true }`

## 3. Comment Delete API

- [x] 3.1 Create `app/api/comments/[id]/route.ts` with `DELETE` handler: auth check, comment lookup (404), ownership/role check (403), transaction: count replies → delete comment → decrement `post.commentCount` by `1 + replyCount`, call `revalidatePath('/plaza/' + postId)`, return `{ success: true }`

## 4. Post Favorite API

- [x] 4.1 Create `app/api/posts/[id]/favorite/route.ts` with `POST` (toggle: upsert/delete Favorite, return `{ favorited }`) and `GET` (return `{ favorited }`) handlers; unauthenticated GET returns `{ favorited: false }`, unauthenticated POST returns 401

## 5. User Content Query APIs

- [x] 5.1 Create `app/api/user/posts/route.ts`: GET, auth required, `Post where authorId=me AND status != DELETED`, order `createdAt DESC`, paginate, return `{ data, total, page, hasMore }`
- [x] 5.2 Create `app/api/user/comments/route.ts`: GET, auth required, `Comment where authorId=me`, include `post: { select: { id, content } }`, order `createdAt DESC`, paginate
- [x] 5.3 Create `app/api/user/likes/route.ts`: GET, auth required, `Like where userId=me`, include Post with author select, order `Like.createdAt DESC`, paginate
- [x] 5.4 Create `app/api/user/favorites/route.ts`: GET, auth required, `Favorite where userId=me AND postId != null`, include Post with author select, order `Favorite.createdAt DESC`, paginate
- [x] 5.5 Create `app/api/user/liked-posts/route.ts`: GET, `ids` query param (comma-split, max 50), unauthenticated returns `{}`, authenticated returns `{ [postId]: true }` map for liked IDs

## 6. PostCard Like Button

- [x] 6.1 Add `initialLiked?: boolean` prop to `components/plaza/post-card.tsx`; initialize local `liked`/`likeCount` state from prop and post data
- [x] 6.2 Wire Heart button onClick: if unauthenticated → redirect `/login`; else optimistic toggle + call `POST /api/posts/[id]/like`; revert on error

## 7. Plaza Client Batch Like State

- [x] 7.1 In `components/plaza/plaza-client.tsx`, after posts render, if user is authenticated call `GET /api/user/liked-posts?ids=...` with current post IDs; store map in state; pass `initialLiked` to each PostCard

## 8. Profile Page Tab Interface

- [x] 8.1 Refactor `app/(main)/profile/page.tsx` to render a 4-tab layout (我的帖子 / 我的评论 / 我的点赞 / 我的收藏) with tab state managed in the Client Component
- [x] 8.2 Implement 我的帖子 tab: lazy fetch `/api/user/posts`, render post cards with title/content truncation/type badge/stats, 删除 button with `window.confirm` → `DELETE /api/posts/[id]` → remove from list, 加载更多 pagination
- [x] 8.3 Implement 我的评论 tab: lazy fetch `/api/user/comments`, render comment + post link, 删除 button with confirm → `DELETE /api/comments/[id]` → remove from list, pagination
- [x] 8.4 Implement 我的点赞 tab: lazy fetch `/api/user/likes`, render read-only post cards linking to `/plaza/[id]`, pagination
- [x] 8.5 Implement 我的收藏 tab: lazy fetch `/api/user/favorites`, render post cards with 取消收藏 button (confirm → toggle API → remove from list), pagination
- [x] 8.6 Ensure tab data is cached in state so switching back does not re-fetch

## 9. Public Profile Posts

- [x] 9.1 In `app/(main)/profile/[username]/page.tsx` (Server Component), query `Post where authorId=user.id AND status=PUBLISHED ORDER BY createdAt DESC LIMIT 10` and pass to client
- [x] 9.2 In `components/profile/profile-client.tsx`, render "TA的帖子" section below user info card with read-only post summary cards (title, content truncated, type badge, time) linking to `/plaza/[id]`; show empty state when no posts

## 10. Remove Disabled Favorite Button

- [x] 10.1 In `app/(main)/communities/[slug]/page.tsx`, remove the `isLoggedIn` branch that renders the disabled "收藏社区" Card; keep the unauthenticated CTA card intact
