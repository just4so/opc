# SPEC: 用户昵称锁定 + 唯一约束

**版本：** 1.0  
**日期：** 2026-03-30  
**状态：** Ready

---

## 背景

当前 `name`（昵称）字段可随时修改且无唯一约束，存在以下问题：
1. 用户可能冒充他人昵称
2. 设置页可无限更改，与产品定位不符

本需求：**昵称一旦设置不可修改，且全站唯一**。

---

## 改动范围

### 1. 数据库（Prisma Schema）

文件：`prisma/schema.prisma`

- `name` 字段加 `@unique` 约束
- 保持 `String?`（允许未设置昵称，但设置后唯一）

```prisma
// Before
name               String?

// After
name               String?   @unique
```

⚠️ **Migration 前置条件**：生产数据库中可能存在重复昵称（包括 null），需要先执行清理脚本（见下方）。null 值不受 unique 约束影响，可以多个。

**清理脚本**（在 migration 前执行）：
```sql
-- 查重
SELECT name, COUNT(*) FROM "User" WHERE name IS NOT NULL GROUP BY name HAVING COUNT(*) > 1;

-- 如有重复，追加随机后缀（保留最早创建的）
UPDATE "User" u
SET name = name || '_' || SUBSTRING(id, 1, 4)
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id FROM "User"
  WHERE name IS NOT NULL
  ORDER BY name, "createdAt" ASC
)
AND name IS NOT NULL;
```

---

### 2. API 层

文件：`app/api/user/profile/route.ts`

**PUT 方法改动：**
- 从 `allowedFields` 中**移除 `name`**，使其不可通过此接口更新
- 首次设置昵称：新增独立接口 `POST /api/user/set-name`（仅在 name 为 null 时允许调用，设置后不可再改）
- `set-name` 接口需检查唯一性，冲突时返回 `400 { error: '昵称已被使用' }`

新增文件：`app/api/user/set-name/route.ts`

```typescript
// 逻辑伪代码
POST /api/user/set-name
- 检查 session
- 检查当前用户 name 是否已为 null（非 null 则拒绝：'昵称已设置，不可修改'）
- 检查 name 格式（2-20字符，无特殊符号）
- 检查 name 唯一性（prisma findUnique）
- 写入
```

---

### 3. 前端设置页

文件：`app/(main)/settings/page.tsx`

**改动逻辑：**
- 如果 `user.name` 已有值 → 昵称输入框改为只读（`disabled` 或 `readOnly`），显示灰色，加说明文字"昵称设置后不可修改"
- 如果 `user.name` 为空 → 保留输入框可编辑，提交时调用 `POST /api/user/set-name`（而非原来的 PUT profile）
- 保存按钮区分：name 为空时单独有"设置昵称"按钮，或提交整个 profile 时后端静默忽略 name 字段（前端走 set-name 单独提交）

**推荐实现**：
- `handleSubmit` 中移除 `name` 字段提交
- 昵称区域单独一个小表单/按钮，调用 `set-name` 接口
- 已有昵称则显示为只读文本

---

### 4. 注册流程（如有设置昵称步骤）

文件：检查 `app/(auth)/register` 或 NextAuth callbacks

- 当前注册流程不设置 name，name 默认 null，**无需改动**
- 用户首次进入设置页时引导设置昵称即可

---

## 验收标准

1. ✅ 已有昵称的用户，设置页昵称框为只读，无法修改
2. ✅ 未设置昵称的用户，可以设置一次，设置成功后变为只读
3. ✅ 设置重复昵称时，接口返回 400 并提示"昵称已被使用"
4. ✅ 直接 PUT /api/user/profile 带 name 字段，不生效（后端忽略）
5. ✅ 数据库 name 字段有 unique 约束，migration 成功
6. ✅ 生产数据中无重复昵称导致 migration 失败

---

## 不在本次范围

- 昵称格式校验规则（暂定 2-20 字符，可后续收紧）
- 管理员强制修改昵称能力
- 昵称修改历史记录
