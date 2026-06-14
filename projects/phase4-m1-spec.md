# Phase 4 M1: DB Schema + 数据迁移

> Milestone: M1
> 状态: 待执行
> 依赖: 无（最先执行）
> PRD 章节参考: 二·N3（数据迁移部分）、一·L1

---

## 任务目标

在不触碰任何业务代码的前提下，完成所有数据库层面的变更：
1. `Inquiry` 模型新增 `acceptInterview` 字段
2. `PostType` 枚举新增 `DEMAND` 值
3. 执行 `npx prisma db push`
4. 执行数据迁移 SQL，将历史帖子迁移到新类型

---

## 文件变更清单

### 唯一改动文件：`prisma/schema.prisma`

#### 变更 1：`model Inquiry` 新增字段

在 `model Inquiry` 的字段列表末尾（`createdAt` 之前或之后）加入：

```prisma
acceptInterview Boolean @default(false)
```

#### 变更 2：`enum PostType` 新增 DEMAND

找到 `enum PostType`，在末尾加入：

```prisma
DEMAND
```

完整枚举应包含（顺序不重要，保留全部旧值不删）：
```prisma
enum PostType {
  DAILY
  EXPERIENCE
  QUESTION
  RESOURCE
  DISCUSSION
  CHAT
  HELP
  SHARE
  COLLAB
  PROGRESS
  DEMAND
}
```

---

## 执行步骤

### Step 1: 修改 schema.prisma（见上）

### Step 2: 推送 Schema 变更

```bash
cd /Users/wei/Documents/opc
npx prisma db push
```

预期输出：`Your database is now in sync with your Prisma schema.`

### Step 3: 验证 Schema 变更

```bash
npx prisma validate
```

### Step 4: 执行数据迁移 SQL

通过 Prisma 执行（避免直接暴露连接串）：

```bash
cd /Users/wei/Documents/opc
npx tsx -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  // 迁移到 SHARE
  const r1 = await prisma.\$executeRaw\`UPDATE \"Post\" SET type = 'SHARE' WHERE type IN ('CHAT', 'PROGRESS', 'RESOURCE')\`
  console.log('→ SHARE 迁移:', r1, '条')

  // 迁移到 DEMAND  
  const r2 = await prisma.\$executeRaw\`UPDATE \"Post\" SET type = 'DEMAND' WHERE type IN ('COLLAB', 'HELP')\`
  console.log('→ DEMAND 迁移:', r2, '条')

  // 清理 PROGRESS 专属字段（仅2条，milestone/projectId 对 SHARE 无意义）
  const r3 = await prisma.\$executeRaw\`UPDATE \"Post\" SET milestone = NULL, \"projectId\" = NULL WHERE milestone IS NOT NULL OR \"projectId\" IS NOT NULL\`
  console.log('→ 清理进展字段:', r3, '条')

  // 验证结果
  const counts = await prisma.\$queryRaw\`SELECT type, COUNT(*) as count FROM \"Post\" GROUP BY type ORDER BY count DESC\`
  console.log('\\n迁移后各类型数量:')
  console.log(JSON.stringify(counts, null, 2))
}
main().then(() => prisma.\$disconnect()).catch(e => { console.error(e); process.exit(1) })
"
```

### Step 5: 验收

迁移后预期结果：
- SHARE: ~244 条（原 CHAT 61 + SHARE 90 + PROGRESS 2 + RESOURCE 1）
- DEMAND: ~76 条（原 COLLAB 41 + HELP 35）
- 其余旧类型（DAILY/EXPERIENCE/QUESTION/COLLAB/HELP/CHAT/PROGRESS/RESOURCE）计数均为 0

---

## 验收标准

- [ ] `npx prisma validate` 通过
- [ ] `npx prisma db push` 无报错
- [ ] `Inquiry` 表有 `acceptInterview` 列（Boolean, 默认 false）
- [ ] `Post.type` 枚举有 `DEMAND` 值
- [ ] 迁移后 SHARE ≈ 244，DEMAND ≈ 76，其余旧类型全部归零
- [ ] `npm run build` 仍然通过（Schema 变更不影响现有代码）

---

## 回滚方案

如果迁移出错：
```sql
-- 回滚 SHARE → CHAT（部分，无法完全区分原来是CHAT/PROGRESS/RESOURCE）
-- 说明：数据迁移不可完全回滚，执行前必须确认DB已备份
-- 生产环境执行前: pg_dump > backup_before_m1.sql
```

⚠️ **执行 M1 前必须确认数据库已备份（EdgeOne 环境有自动备份可查）**
