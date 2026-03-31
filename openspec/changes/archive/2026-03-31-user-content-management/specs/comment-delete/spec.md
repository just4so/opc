## ADDED Requirements

### Requirement: Comment hard-delete API with accurate commentCount update
The system SHALL expose `DELETE /api/comments/[id]` that hard-deletes a comment and its child replies via Prisma cascade. Only the comment author (`session.user.id === comment.authorId`) or a user with role `ADMIN` or `MODERATOR` SHALL be authorized. The endpoint SHALL execute the following in a single Prisma transaction: (1) count direct child replies via `prisma.comment.count({ where: { parentId: commentId } })`; (2) delete the comment (cascade removes children); (3) decrement `post.commentCount` by `1 + replyCount`. After the transaction the endpoint SHALL call `revalidatePath('/plaza/' + postId)` and return `{ success: true }`.

#### Scenario: Author deletes their own comment (no replies)
- **WHEN** the comment author sends `DELETE /api/comments/[id]` and the comment has no replies
- **THEN** the comment is deleted and `post.commentCount` is decremented by 1

#### Scenario: Author deletes their own comment (has replies)
- **WHEN** the comment has 3 replies and the author sends `DELETE /api/comments/[id]`
- **THEN** the comment and all 3 replies are deleted and `post.commentCount` is decremented by 4

#### Scenario: Admin deletes any comment
- **WHEN** an ADMIN or MODERATOR sends `DELETE /api/comments/[id]`
- **THEN** the comment is deleted regardless of authorship, commentCount updated accordingly

#### Scenario: Non-author non-admin cannot delete
- **WHEN** a regular user who is not the comment author sends `DELETE /api/comments/[id]`
- **THEN** HTTP 403 is returned and the comment is unchanged

#### Scenario: Delete non-existent comment
- **WHEN** `DELETE /api/comments/[id]` is called with a non-existent id
- **THEN** HTTP 404 is returned
