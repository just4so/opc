# PRD：邮箱验证 + 密码找回

**版本：** v1.1  
**日期：** 2026-03-28  
**状态：** 已审查，待执行  
**优先级：** 中（功能完整性，降低用户流失）

---

## 一、背景与问题

### 现状
- 注册：手机号（必填）+ 邮箱（选填）+ 密码
- 登录：手机号/邮箱 + 密码（无验证码）
- 当前痛点：
  1. **无密码找回入口**：忘记密码只能联系管理员，完全依赖人工
  2. **邮箱未验证**：用户填写的邮箱无法保证真实可达，影响后续运营触达
  3. **邮箱是选填**：部分用户注册时没填，将来无法通过邮箱触达

### 为什么现在做
- 用户数量到一定规模后，密码丢失是高频支持工单
- 邮箱验证是标准注册流程，不做会显得产品不专业
- SMTP 基础设施已配置（`noreply@opcquan.com`，腾讯企业邮箱），只差接入

### 不做什么（本期范围外）
- 短信验证码登录（成本高，OPC用户群体接受邮箱）
- OAuth 第三方登录（微信/Google）
- 二步验证（2FA）
- 注册时强制填邮箱（保持现有注册门槛低）

---

## 二、功能范围

### 功能 1：密码找回（核心，必做）
用户忘记密码时，通过已绑定的邮箱接收重置链接。

### 功能 2：邮箱验证（次要，建议做）
用户注册或在设置页绑定邮箱后，发送验证邮件确认邮箱真实可达。

---

## 三、用户流程

### 3.1 密码找回流程

```
[登录页] "忘记密码？" 链接
    ↓
[密码找回页 /forgot-password]
  输入邮箱地址
    ↓
[后端] 检查邮箱是否存在
  - 存在 → 生成 token，发送重置邮件，跳转成功页
  - 不存在 → 显示通用成功提示（防止枚举用户）
    ↓
[用户收邮件] 点击 "重置密码" 链接
  链接格式：https://www.opcquan.com/reset-password?token=xxx
  有效期：1小时
    ↓
[重置密码页 /reset-password]
  - 后端校验 token（有效期 & 未使用）
  - 失效 → 提示"链接已过期，请重新申请"
  - 有效 → 显示新密码输入表单
    ↓
[用户提交新密码]
  - 更新 passwordHash
  - 标记 token 为已使用（防重放）
  - 自动登录 + 跳转首页
```

### 3.2 邮箱验证流程（注册后触发）

```
[用户注册时填写了邮箱]
    ↓
[注册成功后] 异步发送验证邮件（不阻塞注册流程）
    ↓
[用户收邮件] 点击 "验证邮箱" 链接
  链接格式：https://www.opcquan.com/verify-email?token=xxx
  有效期：24小时
    ↓
[后端校验 token]
  - 有效 → 更新 emailVerified=true，提示成功
  - 失效 → 提示"链接已过期"，提供"重新发送"按钮
    ↓
[用户设置页] 可手动触发"重新发送验证邮件"
```

---

## 四、数据库变更

### 4.1 新增字段（User 表）

```prisma
model User {
  // ... 现有字段 ...

  // 邮箱验证
  emailVerified      Boolean   @default(false)
  emailVerifyToken   String?   // 邮箱验证 token（一次性）
  emailVerifyExpiry  DateTime? // token 过期时间
  
  // ⚠️ 注意：emailVerified 与现有 verified 字段语义不同
  // verified = 账户身份认证（管理员手动审核）
  // emailVerified = 邮箱地址真实可达（自动验证）
}
```

### 4.2 新增表（OneTimeToken，统一管理两类 token）

**设计决策（v1.1）：** 使用单张 `OneTimeToken` 表替代 PasswordResetToken + User 表内嵌字段的分散方案。
- 避免 User 表字段膨胀
- 两类 token 结构相同，合并减少维护负担
- 支持将来扩展更多 token 类型

```prisma
model OneTimeToken {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "password_reset" | "email_verify"
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime? // null = 未使用，非null = 已使用
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId, type])
}
```

### 4.3 User 表关联补充

```prisma
model User {
  // ... 现有字段 ...
  // 邮箱验证状态（字段保留在 User 表，只需一个 boolean）
  emailVerified   Boolean   @default(false)
  oneTimeTokens   OneTimeToken[]
}
```

**注意：** `emailVerifyToken` 和 `emailVerifyExpiry` 不写 User 表，改由 `OneTimeToken` 管理（type="email_verify"）。

### 4.4 Prisma migration 摘要

```sql
-- User 表新增字段（只保留状态字段）
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- 新增统一 token 表
CREATE TABLE "OneTimeToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE INDEX ON "OneTimeToken"("token");
CREATE INDEX ON "OneTimeToken"("userId", "type");
ALTER TABLE "OneTimeToken" 
  ADD CONSTRAINT "OneTimeToken_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
```

---

## 五、API 设计

### 5.1 POST /api/auth/forgot-password

**功能：** 申请密码重置，发送邮件

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response（始终200，防枚举）:**
```json
{
  "message": "如果该邮箱已注册，你将在几分钟内收到重置邮件"
}
```

**后端逻辑：**
1. 验证邮箱格式（zod）
2. 查找用户（`WHERE email = ?`）
3. 如果用户不存在：直接返回成功（不暴露用户是否存在）
4. 撤销该用户所有未使用的旧 token（`usedAt = NOW()` 标记为已用）
5. 生成新 token（`crypto.randomBytes(32).toString('hex')`）
6. 写入 PasswordResetToken 表，过期时间 = 当前时间 + 1小时
7. 异步发送重置邮件（不 await，快速返回）

**限流（重要）：** 同一邮箱 10 分钟内最多申请 3 次。可用 Redis 或简单用数据库查询近期记录数实现。

---

### 5.2 POST /api/auth/reset-password

**功能：** 使用 token 重置密码

**Request:**
```json
{
  "token": "abc123...",
  "password": "newpassword123"
}
```

**Response 成功（200）:**
```json
{
  "message": "密码重置成功"
}
```

**Response 失败（400）:**
```json
{
  "error": "重置链接已过期或已使用，请重新申请"
}
```

**后端逻辑：**
1. 验证 token 存在且未过期（`expiresAt > NOW()`）且未使用（`usedAt IS NULL`）
2. 校验新密码格式（6位+）
3. 事务：
   - 更新 User.passwordHash（bcryptjs hash，rounds=10）
   - 更新 PasswordResetToken.usedAt = NOW()
4. 返回成功

---

### 5.3 POST /api/auth/send-verify-email

**功能：** 发送（或重发）邮箱验证邮件

**认证：** 需要登录（session）

**Request:** 无 body

**Response（200）:**
```json
{
  "message": "验证邮件已发送，请检查收件箱"
}
```

**后端逻辑：**
1. 获取当前登录用户
2. 检查用户是否有邮箱（没有则返回 400 "请先绑定邮箱"）
3. 检查邮箱是否已验证（已验证则返回 400 "邮箱已完成验证"）
4. 限流：24小时内最多发 5 次（查 emailVerifyExpiry 时间间距）
5. 生成新 token，写入 User.emailVerifyToken + emailVerifyExpiry（24小时）
6. 发送验证邮件

---

### 5.4 GET /api/auth/verify-email?token=xxx

**功能：** 验证邮箱

**认证：** 不需要（链接直接访问）

**Response 成功（200）:**
```json
{
  "message": "邮箱验证成功"
}
```

**Response 失败（400）:**
```json
{
  "error": "验证链接已过期，请重新发送"
}
```

**后端逻辑：**
1. 查 User（`WHERE emailVerifyToken = token`）
2. 检查 emailVerifyExpiry > NOW()
3. 更新 User.emailVerified = true，清空 emailVerifyToken + emailVerifyExpiry
4. 返回成功

---

## 六、邮件模板

### 6.1 密码重置邮件

```
发件人：OPC创业圈 <noreply@opcquan.com>
主题：重置你的 OPC创业圈 密码

---
你好，

我们收到了你的密码重置请求。

点击下方链接重置密码（链接1小时内有效）：

[重置密码]
https://www.opcquan.com/reset-password?token=xxx

如果你没有申请重置密码，请忽略此邮件，你的账户仍然安全。

— OPC创业圈团队
```

**HTML 版本要点：**
- 主色调 #FF6B35（OPC品牌橙）
- 按钮样式：圆角橙色按钮
- 底部注明：此邮件由系统自动发送，请勿回复

---

### 6.2 邮箱验证邮件

```
发件人：OPC创业圈 <noreply@opcquan.com>
主题：验证你的 OPC创业圈 邮箱

---
欢迎来到 OPC创业圈！

点击下方链接验证你的邮箱（链接24小时内有效）：

[验证邮箱]
https://www.opcquan.com/verify-email?token=xxx

验证成功后你将获得：
✅ 接收 OPC 社区最新资讯
✅ 密码找回保障
✅ 账户安全通知

— OPC创业圈团队
```

---

## 七、页面设计

### 7.1 /forgot-password（密码找回申请页）

```
布局：左侧品牌 Panel（同 login/register 风格）+ 右侧表单

表单内容：
  标题：找回密码
  副标题：输入注册时使用的邮箱，我们将发送重置链接
  
  [邮箱] 输入框（type=email）
  
  [发送重置邮件] 按钮（加载态）
  
  [返回登录] 文字链接
  
成功态（显示说明卡片，按钮变灰）：
  "重置邮件已发送到 xxx@xxx.com
   请检查收件箱（包括垃圾邮件箱）
   10分钟内未收到？[重新发送]（10分钟冷却）"
```

### 7.2 /reset-password?token=xxx（重置密码页）

```
Next.js Server Component，服务端渲染时直接查 token 有效性：
  - token 无效/过期 → 直接渲染"链接已过期"页面 + "重新申请"按钮
  - token 有效 → 渲染重置表单（Client Component）

表单内容：
  标题：设置新密码
  
  [新密码] 输入框（min 6位）
  [确认密码] 输入框
  
  [确认重置] 按钮（提交到 /api/auth/reset-password）
  
成功后：
  signIn 自动登录 → 跳转首页
```

**注意：** 不需要额外的 `GET /api/auth/verify-reset-token` 端点，Server Component 直接查 DB。

### 7.3 登录页修改

```
密码输入框下方添加：
  "忘记密码？" → href="/forgot-password"
  样式：text-sm text-gray-500 hover:text-primary
```

### 7.4 设置页（/settings）新增邮箱验证区块

```
账户安全 区块：
  - 邮箱：xxx@xxx.com  [未验证 / ✓ 已验证]
  - 未验证时：[发送验证邮件] 按钮，有冷却提示（"已发送，请检查收件箱"）
```

### 7.5 /verify-email?token=xxx（邮箱验证结果页）

```
纯结果页，无表单：
  - 验证中：Loading 动画（前端自动调用 API）
  - 成功：✅ 邮箱验证成功！[去首页] 按钮
  - 失败：❌ 验证链接已过期 [重新发送] 按钮（需登录态，否则提示登录）
```

---

## 八、邮件发送实现建议

### 8.1 工具选择

**推荐：Nodemailer + 已有腾讯企业邮箱**（最低改造成本）

```bash
npm install nodemailer @types/nodemailer
```

**lib/mailer.ts 核心配置：**
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SMTP_HOST,      // smtp.exmail.qq.com
  port: parseInt(process.env.MAIL_SMTP_PORT || '465'),
  secure: true,                           // SSL
  auth: {
    user: process.env.MAIL_USER,          // noreply@opcquan.com
    pass: process.env.MAIL_AUTH_CODE,     // 企业邮箱密码/授权码
  },
})

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  await transporter.sendMail({
    from: `OPC创业圈 <${process.env.MAIL_USER}>`,
    to,
    subject: '重置你的 OPC创业圈 密码',
    html: generateResetEmailHtml(resetUrl),
    text: `重置密码链接（1小时内有效）：${resetUrl}`,
  })
}

export async function sendEmailVerifyEmail(to: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
  await transporter.sendMail({
    from: `OPC创业圈 <${process.env.MAIL_USER}>`,
    to,
    subject: '验证你的 OPC创业圈 邮箱',
    html: generateVerifyEmailHtml(verifyUrl),
    text: `邮箱验证链接（24小时内有效）：${verifyUrl}`,
  })
}
```

**⚠️ 注意事项：**
1. `MAIL_AUTH_CODE` 需要在腾讯企业邮箱控制台生成应用授权码（不是登录密码）
2. 路径：企业邮箱后台 → 客户端设置 → 生成授权码
3. 发送速率：腾讯企业邮箱单账号 200封/天，够用（早期用户量小）

---

## 九、安全注意事项

| 风险 | 措施 |
|------|------|
| 用户枚举攻击（通过找回密码知道某邮箱是否注册） | forgot-password 接口始终返回成功提示 |
| Token 暴力破解 | Token 用 `crypto.randomBytes(32)`（256位熵），足够安全 |
| Token 重放攻击 | 使用后立即标记 usedAt，不可复用 |
| 大量申请轰炸邮件 | 同邮箱10分钟内最多3次申请 |
| Token 泄露（日志） | Token 只出现在 URL，API 日志不记录完整 URL |
| 旧密码重置链接失效 | 新申请自动撤销所有旧未用 token |

---

## 十、实现顺序建议

**Phase 1（核心，先做）：**
1. Prisma schema 变更 + migration
2. lib/mailer.ts（邮件发送工具）
3. API：forgot-password + reset-password
4. 页面：/forgot-password + /reset-password
5. 登录页添加"忘记密码"链接

**Phase 2（后做）：**
6. API：send-verify-email + verify-email
7. 页面：/verify-email 结果页
8. 设置页添加邮箱验证入口
9. 注册流程：注册成功后自动触发验证邮件

**估计工作量：**
- Phase 1：4-6小时（主要是邮件发送调试）
- Phase 2：2-3小时
- 总计：约1天

---

## 十一、决策记录（v1.1 已确认）

| 问题 | 决策 |
|------|------|
| 注册时邮箱是否改为必填？ | **保持选填**，文案提示"强烈建议填写，用于密码找回" |
| 限流方案 | **纯数据库限流**，查近期记录数，够用 |
| 重置密码后是否自动登录？ | **自动登录** + 跳首页，体验更好 |
| Token 存储方式 | **OneTimeToken 统一表** + type 字段区分，不用多张表 |
| reset-password 页面预校验 | **Server Component 服务端渲染**，不用额外 API 端点 |

⚠️ `MAIL_AUTH_CODE` 需要阿良哥手动获取（腾讯企业邮箱后台 → 客户端专用密码），获取后填入 `.env` 和 EdgeOne 环境变量。
