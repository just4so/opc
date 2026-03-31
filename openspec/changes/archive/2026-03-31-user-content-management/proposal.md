## Why

用户在 OPC圈 发布帖子、评论、点赞、收藏后，没有任何统一的入口来管理这些内容——无法查看自己的历史帖子、删除评论、或回顾收藏。这造成内容管理体验的缺失，降低了用户粘性和平台可信度。现在平台进入精细化运营阶段，需要补全这个闭环。

## What Changes

- **个人中心 `/profile` Tab化**：原来只有资料卡片，改造为4个Tab（我的帖子、我的评论、我的点赞、我的收藏），每个Tab支持分页加载和相应操作
- **帖子删除**：新增 `DELETE /api/posts/[id]` 软删除接口，本人或管理员可操作；PostStatus enum 新增 `DELETED` 值
- **评论删除**：新增 `DELETE /api/comments/[id]` 硬删除接口，同步更新 post.commentCount
- **帖子收藏 API**：新增 `POST/GET /api/posts/[id]/favorite` toggle收藏接口
- **用户内容查询 API**：新增 `/api/user/posts`、`/api/user/comments`、`/api/user/likes`、`/api/user/favorites` 四个分页查询接口
- **列表页点赞按钮补全**：`PostCard` 补全 onClick 逻辑，支持实时点赞/取消；新增批量查询初始liked状态的 `/api/user/liked-posts` 接口
- **公开主页补充帖子列表**：`/profile/[username]` 页面展示该用户最近10条已发布帖子
- **社区详情页移除未实现的收藏按钮**：删除 `/communities/[slug]` 页面中已登录用户看到的 disabled "收藏社区" Card

## Capabilities

### New Capabilities

- `user-content-management`: 用户个人中心Tab化内容管理（我的帖子/评论/点赞/收藏），含删除和取消收藏操作
- `post-delete`: 帖子软删除 API（本人或管理员），PostStatus 新增 DELETED 枚举值
- `comment-delete`: 评论硬删除 API，自动更新 commentCount
- `post-favorite`: 帖子收藏 toggle API（GET/POST /api/posts/[id]/favorite）
- `user-content-apis`: 用户内容查询 API（帖子/评论/点赞/收藏分页列表）
- `post-card-like`: PostCard 点赞按钮交互逻辑补全，批量查询初始liked状态
- `public-profile-posts`: 公开主页（/profile/[username]）展示该用户的帖子列表

### Modified Capabilities

- `login-gate`: 点赞、收藏等需登录操作，未登录时跳转 /login（行为规范已有，此处扩展到收藏和点赞按钮）

## Impact

- **schema**：`prisma/schema.prisma` — PostStatus enum 新增 `DELETED`，需执行 `npx prisma migrate dev`
- **API routes**：新增 8 个路由文件
- **组件**：修改 `post-card.tsx`、`plaza-client.tsx`、`/profile/page.tsx`、`/profile/[username]/page.tsx`、`/communities/[slug]/page.tsx`
- **ISR缓存**：删帖/删评论后调用 `revalidatePath` 刷新 plaza 页面缓存
- **数据一致性**：删评论时 commentCount 必须精确（含子评论数）
