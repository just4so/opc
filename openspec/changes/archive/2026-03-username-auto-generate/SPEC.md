# SPEC: username 自动生成 + 昵称注册必填

**版本：** 1.0  
**日期：** 2026-03-30  
**状态：** Ready

---

## 背景

当前注册页要求用户填写 `username`（用户名），但 username 对用户没有感知价值——登录已有手机号/邮箱，URL 用户也不关心。用户真正感知的是「昵称（name）」，但现在注册时没有昵称字段，导致 38/61 个用户无昵称，全站显示英文 username，体验差。

目标：username 系统自动生成，用户只需填昵称。

---

## 改动范围

### 0. 数据迁移脚本（优先执行）

文件：`scripts/migrate-username-to-name.ts`（新增）

逻辑：对所有 `name = null` 的用户，把 `username` 的值复制到 `name`。

```typescript
// 伪代码
const users = await prisma.user.findMany({ where: { name: null } })
for (const user of users) {
  // 检查 username 是否已被其他人用作 name
  const conflict = await prisma.user.findFirst({ where: { name: user.username, id: { not: user.id } } })
  if (conflict) {
    // 冲突则追加 _2 后缀（极少数情况）
    await prisma.user.update({ where: { id: user.id }, data: { name: user.username + '_2' } })
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { name: user.username } })
  }
}
```

执行方式：`npx ts-node scripts/migrate-username-to-name.ts`  
执行时机：部署前在生产库执行一次。

---

### 1. 注册 API（`app/api/users/route.ts`）

**改动：**

- 移除 `username` 字段从 `registerSchema`
- 新增 `name` 字段到 `registerSchema`：`z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符')`
- 移除 username 唯一性检查
- 新增 name 唯一性检查（`prisma.user.findFirst({ where: { name } })`），冲突返回 `{ error: '昵称已被使用' }`
- 自动生成 username：`'user_' + nanoid(8)`（或用 crypto 生成8位随机字母数字），循环检查唯一性（最多重试3次）
- `prisma.user.create` 的 data 中：`username` 用自动生成值，`name` 用用户填写值

**username 自动生成函数：**
```typescript
async function generateUsername(): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const candidate = 'user_' + Math.random().toString(36).slice(2, 10)
    const exists = await prisma.user.findUnique({ where: { username: candidate } })
    if (!exists) return candidate
  }
  // 极端情况 fallback 用时间戳
  return 'user_' + Date.now().toString(36)
}
```

---

### 2. 注册页（`app/(auth)/register/page.tsx`）

**改动：**

- 移除 `username` state 和输入框
- 新增 `name` state，输入框必填，placeholder：`你的昵称（2-20个字符）`，放在表单第一项
- 移除手机号下方说明文字：`手机号可用于登录，不做短信验证`（整行 `<p>` 删掉）
- `handleSubmit` 中：POST body 移除 `username`，加入 `name`
- 前端校验：name 长度 2-20，trim 后不能为空

---

### 3. 设置页（`app/(main)/settings/page.tsx`）

**改动：**

- 昵称区域逻辑简化：注册时已必填 name，新用户进来 `nameIsSet` 一定为 true，直接显示只读
- 保留"设置昵称"按钮逻辑用于兼容老用户（迁移脚本跑完后老用户也有 name，实际上也不会再出现 name=null 的情况，但代码保留兼容无妨）
- username 字段：在基本信息卡片底部加一行只读展示：
  ```
  <p className="text-xs text-gray-400">用户ID：{username}（系统生成，不可修改）</p>
  ```
  放在最底部，低调展示即可，不做成输入框

---

### 4. 不需要改动的地方

- `lib/auth.ts`：登录逻辑查手机号/邮箱，不涉及 username ✅
- 个人主页 URL `/profile/[username]`：username 仍然存在，只是系统生成，URL 功能不断 ✅
- 全站 `name || username` fallback 逻辑：迁移后老用户有 name，新用户注册时有 name，fallback 不再触发 ✅
- `app/api/user/set-name/route.ts`：保留，兼容极端情况 ✅

---

## 验收标准

1. ✅ 注册页只有「昵称」无「用户名」输入框
2. ✅ 注册页手机号下方无"不做短信验证"提示文字
3. ✅ 注册成功后数据库 username 为 `user_xxxxxxxx` 格式，name 为用户填写值
4. ✅ 注册时填写已存在的昵称，返回"昵称已被使用"
5. ✅ 设置页昵称显示只读（新用户注册时已设）
6. ✅ 设置页底部低调展示 username（只读）
7. ✅ 迁移脚本：38个无昵称老用户的 name 字段被填充
8. ✅ `npm run build` 通过

---

## 执行顺序

1. 写迁移脚本并本地测试
2. 改注册 API
3. 改注册页
4. 改设置页
5. `npx prisma db push`（schema 无变化，跳过）
6. `npm run build` 验收
