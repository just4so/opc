# 技术债清偿计划

> 创建：2026-06-13
> 背景：系统性审计后发现的命名混乱、数据模型职责分裂、点赞 bug 等问题，统一规划清偿。
> **原则：数据安全第一，功能正确第二，代码整洁第三。**

---

## 已确认的设计决策（执行前必读）

### 决策 1：广场三个板块的定义

- **产品**：用户发布自己的产品/项目，有独立页面（`/projects/[slug]`），可持续更新进展（Progress），可评论
- **创业者**：用户本身，有个人主页（`/profile/[username]`），可关注，可喜欢
- **动态**：独立交流空间，发需求/分享/看法/资讯等，对应 `Post` 表

### 决策 2：喜欢功能统一

- 产品和动态都只有**「喜欢」**一个操作，删掉独立的「收藏」按钮
- 底层统一用 `Favorite` 表存储（同时支持 `projectId` 和 `postId`）
- 个人主页「喜欢」tab 展示全部喜欢的产品 + 动态，查 `Favorite` 表即可
- `/api/projects/[slug]/favorite` 接口废弃，统一用 `/api/projects/[slug]/like`
- **禁止**：不能新增独立的收藏表，不能拆成两张表

### 决策 3：Project 表职责拆分

- `Project` 表只保留 `contentType=PROJECT`（产品展示）
- `contentType=DEMAND/COOPERATION` 的 27 条记录迁移到 `Post` 表
- 迁移后产品列表查询加 `contentType: 'PROJECT'` 过滤
- 后台 `/admin/orders` 页面改名为「产品管理」

### 决策 4：命名统一规则

| 位置 | 统一叫法 |
|------|---------|
| 后台侧边栏 | 产品管理 |
| 后台页面 h1 | 产品管理 |
| 后台变量名 | products / ProductItem（可选，不影响功能） |
| 前台广场 tab | 产品 |

---

## Milestone 列表

### M1：喜欢功能整合 + 命名统一（纯代码，无数据风险）

**状态：** 待执行

**范围：**

1. 删掉产品详情页的收藏（⭐）按钮，只保留喜欢（❤️）
2. 删掉 `/api/projects/[slug]/favorite` 独立接口（或改为调用 like 接口）
3. 确认 `/api/projects/[slug]/like` 接口逻辑正确（操作 Favorite 表 + 同步 likeCount）
4. 确认个人主页「喜欢」tab 同时展示产品和动态
5. 后台「产品管理」命名统一（侧边栏已改，补页面 h1 和变量名）
6. 前台广场产品 tab 确认文案是「产品」

**涉及文件：**
- `components/projects/project-detail-client.tsx`（删收藏按钮）
- `app/api/projects/[slug]/favorite/route.ts`（废弃或合并）
- `app/admin/orders/page.tsx`（h1 改「产品管理」，变量名可选改）
- `app/(main)/profile/[username]/page.tsx`（确认喜欢 tab 逻辑）

**验收标准：**
- [ ] `npm run build` 零错误
- [ ] 产品详情页只有一个喜欢按钮，没有收藏按钮
- [ ] 点喜欢后 likeCount 正确变化，不会出现负数
- [ ] 后台侧边栏和页面 h1 都是「产品管理」
- [ ] 个人主页喜欢 tab 能看到喜欢的产品和动态

---

### M2：修复 likeCount 数值不一致（数据修复，主 Agent 直接执行）

**状态：** 待执行（M1 完成后）

**范围：**
1. 查询所有 `Project.likeCount` 与 `Favorite` 表实际记录数不一致的条目
2. 用实际 Favorite 记录数覆盖 `likeCount`
3. 同样检查并修复 `Post.likeCount`

**执行步骤：**
```sql
-- 第一步：先查，看有多少不一致
SELECT p.id, p.name, p."likeCount" as stored, COUNT(f.id) as actual
FROM "Project" p
LEFT JOIN "Favorite" f ON f."projectId" = p.id
GROUP BY p.id, p.name, p."likeCount"
HAVING p."likeCount" != COUNT(f.id)
ORDER BY ABS(p."likeCount" - COUNT(f.id)::int) DESC;

-- 第二步：确认结果合理后，执行修复
UPDATE "Project" p
SET "likeCount" = (SELECT COUNT(*) FROM "Favorite" f WHERE f."projectId" = p.id);

-- 第三步：同样修复 Post
UPDATE "Post" p
SET "likeCount" = (SELECT COUNT(*) FROM "Favorite" f WHERE f."postId" = p.id);
```

**验收标准：**
- [ ] 修复后查询不一致条目为 0
- [ ] 没有负数 likeCount

---

### M3：Project 表拆分迁移（OpenSpec 出规格，ACP 执行）

**状态：** 待执行（M2 完成后）

**背景数据：**
- 需迁移：`contentType=DEMAND` 7条，`contentType=COOPERATION` 20条，共 27 条
- 关联数据：有 Comment 的 1 条，有 Favorite 的 2 条，影响极小

**范围：**
1. 写迁移脚本：把 27 条 Project(DEMAND/COOPERATION) → Post 表
2. 关联数据（Comment/Favorite）的 projectId → postId 重新指向
3. 前台产品列表查询加 `contentType: 'PROJECT'` 过滤
4. 前台动态 tab 确认能展示迁移过来的 Post
5. 迁移完成后删掉 Project 表的 DEMAND/COOPERATION 数据
6. **暂不删除** `contentType` 字段（等观察一段时间后 M4 再清理）

**风险控制：**
- 执行前备份这 27 条数据到临时表
- 本地用生产数据副本跑通后再上生产
- 每步执行后核对行数

**禁止事项：**
- 禁止直接 DELETE 数据（先备份，再软删除，确认无误再硬删）
- 禁止修改产品详情页 `/projects/[slug]` 的路由
- 禁止改动 Progress 表（Progress 只属于产品，不跟着迁移）

**验收标准：**
- [ ] 迁移后 Project 表无 DEMAND/COOPERATION 记录
- [ ] 27 条数据在 Post 表可查到
- [ ] 前台产品列表不再显示需求/合作类内容
- [ ] 前台动态列表能展示迁移过来的内容
- [ ] `npm run build` 零错误

---

### M4：Schema 清理（ACP 执行，M3 稳定后）

**状态：** 待执行

**范围：**
1. `Project.tagline` 字段：67 条有值的数据合并到 description，然后删字段
2. `CommunityClaim.status` 和 `type` 从裸字符串改为 enum
3. `PostType.DAILY` enum 值删除（数据库中 0 条使用）

**验收标准：**
- [ ] `npm run build` 零错误
- [ ] `npm run db:push` 成功
- [ ] 没有任何前台功能受影响

---

## 进度追踪

| Milestone | 状态 | 完成时间 | 备注 |
|-----------|------|---------|------|
| M1 喜欢整合+命名 | ⏳ 待执行 | - | - |
| M2 likeCount 修复 | ⏳ 待 M1 | - | - |
| M3 Project 拆分 | ⏳ 待 M2 | - | 需 OpenSpec |
| M4 Schema 清理 | ⏳ 待 M3 | - | - |

---

## 附：现有数据快照（2026-06-13）

```
Project 总数：140
  - contentType=PROJECT：113 条
  - contentType=DEMAND：7 条
  - contentType=COOPERATION：20 条

Post 总数：180
  - CHAT：63，SHARE：52，HELP：35，COLLAB：27，PROGRESS：2，RESOURCE：1

Favorite 总数：
  - on Project：73 条
  - on Post：27 条

User：1209，Community：441，Inquiry：126
```
