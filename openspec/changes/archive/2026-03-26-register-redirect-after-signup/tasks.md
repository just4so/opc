## 1. 注册页改造

- [x] 1.1 在 `src/app/(auth)/register/page.tsx` 中添加 `useSearchParams` 读取 `callbackUrl`，用 `Suspense` 包裹组件
- [x] 1.2 添加 `signIn` 导入（from `next-auth/react`）
- [x] 1.3 在 `handleSubmit` 中注册成功后调用 `signIn("credentials", { email/phone, password, redirect: false })`
- [x] 1.4 signIn 成功后 `router.push(callbackUrl || "/")`，失败则提示「注册成功，请手动登录」并跳转 `/login`
- [x] 1.5 添加 callbackUrl 安全校验：仅接受以 `/` 开头的相对路径，否则回退到 `/`

## 2. 登录页链接透传

- [x] 2.1 在 `src/app/(auth)/login/page.tsx` 中修改「立即注册」链接，将当前 callbackUrl 透传到 `/register?callbackUrl=xxx`

## 3. 验证

- [x] 3.1 验证注册页能正确读取 callbackUrl 参数
- [x] 3.2 验证注册成功后自动登录并跳转到 callbackUrl
- [x] 3.3 验证无 callbackUrl 时跳转到 `/`
- [x] 3.4 验证自动登录失败时降级到手动登录提示
- [x] 3.5 验证外部 URL 的 callbackUrl 被正确忽略
