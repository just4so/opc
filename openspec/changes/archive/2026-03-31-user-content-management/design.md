## Context

OPC圈是基于 Next.js 14 App Router + Prisma + PostgreSQL 的社区平台。当前用户发帖、评论、点赞、收藏等行为的数据均已在数据库中存储，但缺少统一的用户内容管理入口。`/profile` 页面仅展示资料卡片，`PostCard` 点赞按钮无实际交互，收藏功能数据模型（`Favorite` 表）已存在但无对应 API 和 UI。

本次改造涉及：数据库 schema 变更、8个新 API 路由、多个组件修改，属于跨模块的中等规模变更。

## Goals / Non-Goals

**Goals:**
- 用户可在个人中心查看并管理自己的帖子、评论、点赞、收藏
- 用户可以删除自己的帖子（软删除）和评论（硬删除）
- 用户可以取消收藏帖子
- PostCard 列表页点赞按钮真正可用（含初始 liked 状态）
- 公开主页展示该用户的帖子列表
- 移除社区详情页已登录用户的 disabled 收藏按钮（未完成功能）

**Non-Goals:**
- 批量删除帖子/评论
- 帖子编辑功能
- 社区收藏功能（仅移除占位按钮）
- 通知系统
- 点赞数实时推送

## Decisions

### D1：PostStatus 软删除 vs 物理删除

**决策**：帖子采用软删除（`status = DELETED`），评论采用硬删除。

**理由**：
- 帖子是重要内容资产，软删除便于管理员审计和数据恢复
- 评论数量大、单条价值低，硬删除更简洁，Prisma 的 Cascade 自动处理子评论
- 评论删除需精确维护 `commentCount`，物理删除 + transaction 更可靠

**替代方案**：评论也软删除 → 查询时需额外过滤 DELETED 评论，增加复杂度，不值得

### D2：个人中心 API 路径设计

**决策**：使用 `/api/user/[resource]` 统一前缀（posts/comments/likes/favorites），而非 `/api/profile/[resource]`。

**理由**：语义更清晰——这是"当前登录用户的资源"，不是"个人主页数据"。与现有 `/api/posts`、`/api/comments` 体系平行。

### D3：列表页 liked 状态批量查询

**决策**：在 `plaza-client.tsx` 中，列表渲染完成后单独调用 `/api/user/liked-posts?ids=...` 批量获取初始 liked 状态，结果 map 传给每个 PostCard。

**理由**：
- 帖子列表是 ISR 缓存的，不能在列表 API 中混入用户个性化数据
- 一次批量请求比每个 PostCard 单独请求效率更高
- 只对已登录用户触发，未登录用户跳过

**替代方案**：每个 PostCard 自己请求 `/api/posts/[id]/like`（GET）→ N+1 请求，性能差

### D4：/profile 页面架构

**决策**：保持 `/app/(main)/profile/page.tsx` 为 Client Component（`'use client'`），Tab 切换在客户端完成，每个 Tab 首次激活时才请求对应 API（懒加载）。

**理由**：
- 用户个人中心数据实时性要求高，不适合 ISR 缓存
- Tab 懒加载避免页面加载时一次性请求4个 API
- 状态（已删除条目）需要在客户端维护

### D5：公开主页帖子列表渲染方式

**决策**：`/profile/[username]/page.tsx`（Server Component）直接 Prisma 查询最近10条帖子，随页面 SSR 下发，不增加 Client fetch。

**理由**：公开主页是展示性内容，帖子列表只读，无需客户端交互，SSR 对 SEO 友好，复用已有的 Server Component 模式。

### D6：收藏 API 设计

**决策**：参照现有 like API 实现 toggle 模式（`POST /api/posts/[id]/favorite`），不新增独立的 DELETE 路由。

**理由**：与现有 like 接口保持一致的 API 风格，前端逻辑复用。

## Risks / Trade-offs

- **[Risk] commentCount 不准确** → Mitigation：删除评论时在同一 Prisma transaction 中先 count replies，再统一减 `1 + replyCount`，避免并发导致的计数偏差
- **[Risk] ISR 缓存延迟** → Mitigation：删帖/删评论后立即调用 `revalidatePath`，确保 60 秒内 plaza 页面刷新
- **[Risk] schema migration 影响生产** → Mitigation：仅新增 enum 值（`DELETED`），向后兼容，不影响现有数据；迁移文件提交到版本控制
- **[Risk] 批量 liked-posts 请求参数过长** → Mitigation：当前列表每页最多20条帖子，URL 长度可接受；超过50条时可改为 POST body
- **[Risk] Tab 切换后数据陈旧** → Mitigation：Tab 切换时如果已缓存数据则不重复请求（acceptable trade-off），用户刷新页面可获取最新数据

## Migration Plan

1. 修改 `prisma/schema.prisma`，PostStatus enum 新增 `DELETED`
2. 执行 `npx prisma migrate dev --name add-post-status-deleted`
3. 执行 `npx prisma generate` 更新客户端
4. 部署新 API 路由和组件变更
5. 无需数据迁移（只是新增 enum 值，现有数据不受影响）

**Rollback**：回滚代码即可，数据库 enum 新增值不影响回滚后的查询（现有代码不使用 DELETED 值）。

## Open Questions

- `PostCard` 在 plaza 列表页和公开主页（`/profile/[username]`）都会用到——是否需要在公开主页也展示 liked 状态？（建议：不需要，公开主页帖子列表只读展示即可）
- `Favorite` 表当前是否已有 unique constraint（userId + postId）？（需在 schema 中确认，参照 Like 表结构）
