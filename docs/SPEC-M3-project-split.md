# SPEC：M3 — Project 表拆分迁移

> 版本：v1.0（2026-06-13）
> 执行人：Claude Code（ACP）
> 风险等级：中（有数据迁移，已备份）
> 备份表：`_migration_m3_projects_backup`（27条，可随时回滚）

---

## 背景

`Project` 表历史上承担了两种职责：
1. `contentType=PROJECT`：产品展示页（正确归属）
2. `contentType=DEMAND/COOPERATION`：需求/合作帖（应归属 `Post` 表）

本次迁移把 27 条 DEMAND/COOPERATION 记录从 `Project` 表迁移到 `Post` 表，彻底分离职责。

**数据现状（已确认）：**
- 待迁移：DEMAND 7条 + COOPERATION 20条 = 共 27条
- 有 Comment 的：1条
- 有 Favorite 的：2条
- 备份表：`_migration_m3_projects_backup`（已建好）

---

## 字段映射关系

| Project 字段 | Post 字段 | 说明 |
|-------------|----------|------|
| `name` | `title` | 标题 |
| `description` | `content` | 正文内容 |
| `contentType=DEMAND` | `type=COLLAB` | 映射到最接近的 Post 类型 |
| `contentType=COOPERATION` | `type=SHARE` | 映射到最接近的 Post 类型 |
| `ownerId` | `authorId` | 作者 |
| `status=PUBLISHED` | `status=PUBLISHED` | 状态直接映射 |
| `status=其他` | `status=HIDDEN` | 非发布状态统一隐藏 |
| `skills` | `skills` | 技能标签 |
| `budgetMin/Max` | `budgetMin/Max` | 预算 |
| `budgetType` | `budgetType` | 预算类型 |
| `deadline` | `deadline` | 截止日期 |
| `contactInfo` | `contactInfo` | 联系方式 |
| `contactType` | `contactType` | 联系类型 |
| `createdAt` | `createdAt` | 保留原始时间（用 $executeRaw 写入） |
| `images` | `images` | 图片 |

**不迁移的字段**（产品专属，Post 表没有）：
- slug, logo, coverImage, category, techStack, stage, mrr, userCount
- isRevenuePublic, website, github, productHunt, appStore, playStore
- launchedAt, tagline, viewCount, likeCount, commentCount（Post 有自己的计数）

---

## 执行步骤（严格按顺序）

### Step 1：写迁移脚本

创建 `scripts/m3-migrate.ts`，逻辑：

```typescript
// 伪代码，Claude Code 自行实现
for each project WHERE contentType IN ('DEMAND', 'COOPERATION'):
  
  // 1. 在 Post 表创建对应记录
  const newPost = await prisma.post.create({
    data: {
      title: project.name,
      content: project.description,
      type: project.contentType === 'DEMAND' ? 'COLLAB' : 'SHARE',
      status: project.status === 'PUBLISHED' ? 'PUBLISHED' : 'HIDDEN',
      authorId: project.ownerId,
      skills: project.skills,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      budgetType: project.budgetType,
      deadline: project.deadline,
      contactInfo: project.contactInfo,
      contactType: project.contactType,
      images: project.images,
      // createdAt 用 $executeRaw 补写，保留原始时间
    }
  })
  
  // 2. 迁移 Comment（projectId → postId）
  await prisma.comment.updateMany({
    where: { projectId: project.id },
    data: { projectId: null, postId: newPost.id }
  })
  
  // 3. 迁移 Favorite（projectId → postId）
  await prisma.favorite.updateMany({
    where: { projectId: project.id },
    data: { projectId: null, postId: newPost.id }
  })
  
  // 4. 记录映射关系（projectId → postId），用于后续验证
  migrationMap.push({ projectId: project.id, postId: newPost.id })
```

### Step 2：验证迁移结果

迁移完成后，脚本必须输出验证报告：
- 迁移的 Post 数量 = 27
- Comment 迁移数量正确（应为 1）
- Favorite 迁移数量正确（应为 2）
- 所有迁移的 Post 都能查到（SELECT COUNT 验证）

### Step 3：软删除 Project 记录

验证通过后，把这 27 条 Project 记录的 status 改为 `ARCHIVED`（不是直接删除）：

```sql
UPDATE "Project"
SET status = 'ARCHIVED'
WHERE "contentType" IN ('DEMAND', 'COOPERATION')
```

**禁止直接 DELETE**，等整体确认无误后再删。

### Step 4：更新前台产品列表查询

文件：`lib/queries/plaza.ts` 和 `app/api/plaza/projects/route.ts`

在所有查询产品列表的地方加上过滤条件：
```typescript
where: {
  status: 'PUBLISHED',
  contentType: 'PROJECT',  // 新增这一行
  // ... 其他条件不变
}
```

### Step 5：build 验证

```bash
npm run build
```
必须零错误才算完成。

---

## 禁止事项（硬规则）

1. **禁止** 直接 DELETE Project 记录（用 ARCHIVED 软删除）
2. **禁止** 修改 `/projects/[slug]` 产品详情页的任何逻辑
3. **禁止** 修改 `Progress` 表（进展只属于产品）
4. **禁止** 删除 `Project.contentType` 字段（M4 再清理）
5. **禁止** 一次性执行所有步骤不验证（每步必须有输出确认）
6. **文件操作** 只用 Bash/Write/Edit 原生工具

---

## 验收清单

- [ ] `scripts/m3-migrate.ts` 执行成功，输出验证报告
- [ ] Post 表新增 27 条记录
- [ ] 原有 Comment（1条）已指向新 Post
- [ ] 原有 Favorite（2条）已指向新 Post
- [ ] 27 条 Project 状态改为 ARCHIVED（不是 DELETE）
- [ ] 前台产品列表加了 `contentType: 'PROJECT'` 过滤
- [ ] `npm run build` 零错误
- [ ] 备份表 `_migration_m3_projects_backup` 未被删除（保留待确认）

---

## 回滚方案（如果出错）

```sql
-- 1. 恢复 Project 状态
UPDATE "Project" p
SET status = b.status
FROM "_migration_m3_projects_backup" b
WHERE p.id = b.id;

-- 2. 删掉迁移的 Post（根据迁移脚本输出的 postId 列表）
-- 3. Comment/Favorite 的 projectId 回写（根据 migrationMap）
```
