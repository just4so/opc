## ADDED Requirements

### Requirement: Post soft-delete API
The system SHALL expose `DELETE /api/posts/[id]` that soft-deletes a post by setting its `status` to `DELETED`. Only the post author (`session.user.id === post.authorId`) or a user with role `ADMIN` or `MODERATOR` SHALL be authorized. Unauthorized requests SHALL receive HTTP 403. Non-existent posts SHALL receive HTTP 404. On success the endpoint SHALL call `revalidatePath('/plaza')` and `revalidatePath('/plaza/' + id)`, then return `{ success: true }`.

#### Scenario: Author deletes their own post
- **WHEN** the authenticated post author sends `DELETE /api/posts/[id]`
- **THEN** `post.status` is set to `DELETED`, cache is revalidated, and `{ success: true }` is returned

#### Scenario: Admin deletes any post
- **WHEN** an ADMIN or MODERATOR sends `DELETE /api/posts/[id]`
- **THEN** the post is soft-deleted regardless of authorship

#### Scenario: Non-author non-admin cannot delete
- **WHEN** a regular user who is not the post author sends `DELETE /api/posts/[id]`
- **THEN** HTTP 403 is returned and the post is unchanged

#### Scenario: Delete non-existent post
- **WHEN** `DELETE /api/posts/[id]` is called with an id that does not exist
- **THEN** HTTP 404 is returned

#### Scenario: Unauthenticated request is rejected
- **WHEN** `DELETE /api/posts/[id]` is called without a valid session
- **THEN** HTTP 401 is returned
