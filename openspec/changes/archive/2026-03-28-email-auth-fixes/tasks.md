## 1. 注册后自动发验证邮件

- [x] 1.1 在 `app/api/users/route.ts` 顶部导入 `crypto`、`sendEmailVerifyEmail`（来自 `@/lib/mailer`）
- [x] 1.2 在用户创建成功后（`prisma.user.create` 返回后），若 `user.email` 存在，创建 `OneTimeToken`（type=`email_verify`，24h 过期）并 fire-and-forget 调用 `sendEmailVerifyEmail(user.email, token).catch(console.error)`

## 2. 重置密码后自动登录

- [x] 2.1 在 `app/api/auth/reset-password/route.ts` 的事务完成后，查询 `user.phone`（通过 `record.userId`）并在响应中追加 `identifier: user.phone`
- [x] 2.2 在 `app/(auth)/reset-password/reset-form.tsx` 的成功分支中，将 `signIn('credentials', { email: '', password, redirect: false })` 改为 `signIn('credentials', { email: data.identifier, password, redirect: false })`

## 3. 设置页绑定邮箱

- [x] 3.1 在 `app/api/user/profile/route.ts` 的 `allowedFields` 数组中加入 `'email'`；在 `prisma.user.update` 之前，若 `updateData.email`，查询是否有其他用户已使用该邮箱（`findFirst({ where: { email, NOT: { id: session.user.id } } })`），有则返回 400 `{ error: '邮箱已被使用' }`
- [x] 3.2 在 `app/(main)/settings/page.tsx` 中，添加 `bindEmail` 和 `bindingEmail` 两个 state；在"账户安全"卡片内，当 `userEmail` 为 null 时渲染邮箱输入框 + "绑定邮箱"按钮
- [x] 3.3 编写 `handleBindEmail` 函数：调用 `PUT /api/user/profile` 传入 `{ email: bindEmail }`；成功后 fire-and-forget 调用 `POST /api/auth/send-verify-email`；更新 `userEmail` state 并显示"已绑定 \<email\>，验证邮件已发送"
