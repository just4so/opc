## Why

email-auth 功能已有路由和 API 骨架，但存在 3 处实现缺口：注册后不发验证邮件、重置密码后无法自动登录、设置页无法绑定邮箱（另外 2 处 forgot-password 重发和 verify-email 重发已经实现）。这些缺口导致邮箱验证链路断裂，用户无法走完完整流程。

## What Changes

- **注册流程**：`POST /api/users` 创建用户成功且有邮箱时，fire-and-forget 异步发送验证邮件（含 OneTimeToken 创建）
- **重置密码**：`POST /api/auth/reset-password` 响应增加 `identifier` 字段（用户手机号），供前端调用 `signIn('credentials', { email: identifier, password })` 自动登录；修复 `reset-form.tsx` 中原来传 `email: ''` 的错误
- **绑定邮箱**：设置页"账户安全"卡片在 `userEmail` 为 null 时显示邮箱输入框 + 绑定按钮；`PUT /api/user/profile` 增加 `email` 到 allowedFields（含唯一性校验）；绑定成功后自动调 `POST /api/auth/send-verify-email`

## Capabilities

### New Capabilities

- `email-bind-on-settings`: 已登录用户在设置页绑定邮箱，绑定后自动发送验证邮件

### Modified Capabilities

- `auto-login-after-register`: 扩展覆盖范围——注册时有邮箱则同步创建 OneTimeToken 并 fire-and-forget 发验证邮件

## Impact

- **修改文件**：`app/api/users/route.ts`、`app/api/auth/reset-password/route.ts`、`app/(auth)/reset-password/reset-form.tsx`、`app/(main)/settings/page.tsx`、`app/api/user/profile/route.ts`
- **新增 spec**：`openspec/specs/email-bind-on-settings/spec.md`
- **无新依赖**，`lib/mailer.ts`、`prisma/schema.prisma`、`lib/auth.ts` 均无需改动
