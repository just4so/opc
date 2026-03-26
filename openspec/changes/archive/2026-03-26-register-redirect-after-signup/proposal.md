## Why

注册成功后用户被固定跳转到 `/login?registered=true`，需要再次手动输入凭据登录。当用户从受保护页面被重定向到登录/注册时，middleware 已将 `callbackUrl` 附加到 URL，但注册页既不读取该参数，也不在注册后自动登录，导致跳转链路断裂、用户体验差。

## What Changes

- 注册页读取 URL 中的 `callbackUrl` 参数（通过 `useSearchParams`）
- 注册成功后立即调用 `signIn("credentials", { redirect: false })` 自动登录，无需跳转到登录页
- 自动登录成功后跳转到 `callbackUrl`（默认 `/`）
- 自动登录失败时降级：提示「注册成功，请手动登录」并跳转到 `/login`
- 登录页「立即注册」链接透传 `callbackUrl` 到注册页

## Capabilities

### New Capabilities
- `auto-login-after-register`: 注册成功后自动登录并跳转到来源页面的能力

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **文件变更**: `src/app/(auth)/register/page.tsx`（主要变更）
- **依赖**: 新增 `next-auth/react` 的 `signIn` 导入
- **API**: 无接口变更，复用现有 `/api/users` 注册接口和 NextAuth credentials provider
- **安全**: `callbackUrl` 需验证为站内路径（以 `/` 开头），防止 open redirect
