## Context

当前注册流程：用户填写表单 → POST `/api/users` → 成功后 `router.push('/login?registered=true')` → 用户在登录页重新输入凭据 → 登录成功跳转。

middleware.ts 已为未登录用户在重定向到 `/login` 时附加 `callbackUrl` 参数，但注册页从未读取或传递该参数。

项目使用 NextAuth.js v5 beta、credentials provider、JWT strategy。`signIn` 函数来自 `next-auth/react`，支持 `redirect: false` 模式在客户端静默登录。

## Goals / Non-Goals

**Goals:**
- 注册成功后无缝自动登录，减少用户操作步骤
- 保持 callbackUrl 跳转链路完整，用户最终回到来源页面
- 自动登录失败时优雅降级到手动登录

**Non-Goals:**
- 不修改注册 API (`/api/users`) 的逻辑
- 不修改 NextAuth 配置或 credentials provider
- 不修改 middleware.ts 的重定向逻辑
- 不实现 OAuth/第三方登录后的自动跳转（不在范围内）

## Decisions

### 1. 使用 `signIn("credentials", { redirect: false })` 做客户端静默登录

**选择**: 注册成功后在浏览器端调用 next-auth/react 的 `signIn`，而非服务端登录。

**理由**:
- 注册页已是 Client Component（`'use client'`），可直接调用 `signIn`
- `redirect: false` 允许我们控制登录结果后的跳转逻辑
- 无需修改 API route 或服务端逻辑

**备选方案**: 在 `/api/users` 注册 API 中同时完成登录（设置 session cookie）。但这需要修改 API 并与 NextAuth 的 session 管理耦合，复杂度更高。

### 2. callbackUrl 验证仅检查相对路径

**选择**: 只接受以 `/` 开头的 callbackUrl，拒绝绝对 URL。

**理由**: 防止 open redirect 攻击，保证用户只跳转到站内页面。NextAuth 本身也有类似校验，但在客户端多一层防护更安全。

### 3. 使用 `useSearchParams` 读取 callbackUrl

**选择**: 通过 Next.js 的 `useSearchParams` hook 读取 URL 参数。

**理由**: 注册页是 Client Component，`useSearchParams` 是标准做法。需要用 `Suspense` 包裹组件以支持 SSR。

## Risks / Trade-offs

- **[注册成功但自动登录失败]** → 降级处理：显示成功提示，引导用户手动登录。用户数据不会丢失。
- **[callbackUrl 被篡改为外部链接]** → 仅接受以 `/` 开头的路径，忽略其他值。
- **[signIn 调用增加注册流程耗时]** → signIn 通常 < 500ms，用户感知为「注册中...」loading 状态延长，可接受。
