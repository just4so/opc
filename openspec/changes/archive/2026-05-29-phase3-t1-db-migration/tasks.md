# Phase 3 T1: DB Migration

> Change: phase3-t1-db-migration
> PRD: docs/community-upgrade-phase3-prd.md (Section 2.1, 2.2)
> Branch: feature/community-upgrade

---

## Overview

数据库层面的变更，为 Phase 3 后续任务打基础：
1. 废弃 Like 表，统一用 Favorite 表处理"喜欢"
2. 新增 Progress 模型（独立于 Post，专门记录产品进展）
3. Project 新增 images 字段（String[]，最多 5 张）
4. tagline 字段废弃，内容迁移到 description

---

## Task 1: 新增 Progress 模型

**Schema 变更 (`prisma/schema.prisma`):**

```prisma
model Progress {
  id        String   @id @default(cuid())
  content   String
  milestone String?
  images    String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  String
  projectId String
  author    User     @relation("UserProgress", fields: [authorId], references: [id], onDelete: Cascade)
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
  @@index([authorId, createdAt])
}
```

**同时修改:**
- User 模型添加: `progress Progress[] @relation("UserProgress")`
- Project 模型添加: `progress Progress[]`

**验收标准:**
- [ ] Progress 模型存在于 schema.prisma
- [ ] User 和 Project 模型有对应 relation
- [ ] `npx prisma validate` 通过
- [ ] `npx prisma generate` 通过

---

## Task 2: Project 新增 images 字段

**Schema 变更 (`prisma/schema.prisma`):**

在 Project 模型中，`screenshots` 字段之后添加:
```prisma
  images      String[]    // 产品图片，最多5张，第一张为封面
```

> 注意：`screenshots` 字段保留不删（可能有历史数据），`images` 是新的产品展示图片字段。

**验收标准:**
- [ ] Project 模型有 `images String[]` 字段
- [ ] `npx prisma validate` 通过

---

## Task 3: 废弃 Like 表，统一用 Favorite

**变更内容:**

### 3.1 数据迁移脚本

创建 `scripts/migrate-likes-to-favorites.ts`:
- 读取所有 Like 记录
- 对每条 Like，检查 Favorite 表是否已有相同 userId+postId 或 userId+projectId
- 如果没有，创建对应 Favorite 记录
- 输出迁移统计（总数、新增数、跳过数）
- 幂等：可重复运行

### 3.2 修改 API 路由

**`app/api/posts/[id]/like/route.ts`** → 改为操作 Favorite 表:
- POST: 创建/删除 Favorite（userId+postId），同时更新 post.likeCount
- GET: 查询 Favorite 是否存在
- 返回格式不变: `{ liked: boolean }`
- 保留 createPostLikedNotification 调用

**`app/api/user/liked-posts/route.ts`** → 改为查询 Favorite 表:
- `prisma.favorite.findMany({ where: { userId, postId: { not: null } } })`

**`app/api/user/likes/route.ts`** → 改为查询 Favorite 表

**`app/api/cron/daily-digest/route.ts`** → 改为查询 Favorite 表:
- 将 `prisma.like.findMany` 改为 `prisma.favorite.findMany`

### 3.3 Schema 清理

- 从 Post 模型移除: `likes Like[]`
- 从 Project 模型移除: `likes Like[]`
- 从 User 模型移除: `likes Like[]`
- **暂不删除 Like 模型本身**（等数据迁移确认完成后再删，避免数据丢失）
- 在 Like 模型上方添加注释: `// @deprecated - 已迁移到 Favorite，待确认后删除`

### 3.4 前端组件

**`components/plaza/post-interactions.tsx`** (或相关交互组件):
- 确认"喜欢"按钮调用的是 `/api/posts/[id]/like` 路由（路由名不变，内部改用 Favorite）
- 无需改前端逻辑，API 返回格式不变

**验收标准:**
- [ ] `scripts/migrate-likes-to-favorites.ts` 存在且可运行 (`npx tsx scripts/migrate-likes-to-favorites.ts`)
- [ ] `/api/posts/[id]/like` POST 创建 Favorite 记录（不再创建 Like）
- [ ] `/api/posts/[id]/like` GET 查询 Favorite 表
- [ ] `/api/user/liked-posts` 查询 Favorite 表
- [ ] `/api/user/likes` 查询 Favorite 表
- [ ] `/api/cron/daily-digest` 查询 Favorite 表
- [ ] Like 模型标记为 deprecated 但未删除
- [ ] Post/Project/User 模型移除 likes 关系
- [ ] `npx prisma validate` 通过
- [ ] `npm run build` 通过（无 TS 错误）

---

## Task 4: tagline 废弃处理

**变更内容:**

### 4.1 Schema

- Project 模型: `tagline` 字段改为 optional (`String?`)，添加注释 `// @deprecated - 合并到 description`
- 不删除字段（保留向后兼容）

### 4.2 数据迁移脚本

创建 `scripts/migrate-tagline-to-description.ts`:
- 查找所有 tagline 非空的 Project
- 如果 description 为空或很短（<50字符），将 tagline 拼接到 description 前面
- 如果 description 已经足够长，跳过
- 输出统计

### 4.3 代码引用清理

搜索所有引用 `tagline` 的文件，改为使用 `description`:
- 直通车表单（connect-form.tsx）: 如果有 tagline 输入框，改为 description
- 产品卡片: 显示 description 截断，不再显示 tagline
- 产品详情页: 不再单独展示 tagline
- Settings 产品编辑: tagline 输入框改为 description（或合并）
- API 路由: 创建/更新 Project 时不再写 tagline

**验收标准:**
- [ ] Project.tagline 改为 `String?`（optional）
- [ ] `scripts/migrate-tagline-to-description.ts` 存在且可运行
- [ ] 全项目 `grep -rn "tagline" app/ components/ lib/` 结果中无活跃使用（只有 schema 定义和迁移脚本）
- [ ] 产品创建/编辑流程不再写入 tagline 字段
- [ ] 产品展示（卡片、详情页）使用 description 而非 tagline
- [ ] `npm run build` 通过

---

## Task 5: 运行迁移 & 最终验证

**操作步骤（按顺序）:**

1. `npm run db:push` — 推送 schema 变更到数据库
2. `npx tsx scripts/migrate-likes-to-favorites.ts` — 迁移 Like 数据
3. `npx tsx scripts/migrate-tagline-to-description.ts` — 迁移 tagline 数据
4. `npm run build` — 确认全量构建通过

**验收标准:**
- [ ] `npm run db:push` 成功（无报错）
- [ ] 迁移脚本运行成功，输出统计数据
- [ ] `npm run build` 通过
- [ ] `npx prisma validate` 通过
- [ ] 本地 `npm run dev` 启动后，广场页面正常加载（不白屏）

---

## 不做的事（明确排除）

- ❌ 不删除 Like 模型（等 T7 最终清理时删）
- ❌ 不改 Favorite 表结构（已有 unique constraints 满足需求）
- ❌ 不改前端"喜欢"按钮的 UI（T3 卡片重设计时再改）
- ❌ 不新增 API 路由（复用现有路由，内部实现改为 Favorite）
- ❌ 不处理 Project 的 like 路由（当前产品详情页用的是 Favorite，不是 Like）
