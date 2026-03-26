## 1. LoginGate 组件

- [x] 1.1 创建 `components/community/login-gate.tsx` Client Component，实现 props（isLoggedIn, message, registerUrl, children），未登录时渲染 blur 遮罩 + 锁图标 + message + 注册按钮，已登录时直接渲染 children

## 2. 页面 auth 集成

- [x] 2.1 在 `app/(main)/communities/[slug]/page.tsx` 中导入 `auth` 并调用获取 session，计算 `isLoggedIn = !!session?.user`，构造 `registerUrl = /register?callbackUrl=/communities/${community.slug}`

## 3. 信息门控改造

- [x] 3.1 精确地址门控：将侧边栏"基本信息"卡片中的 address 区域用 LoginGate 包裹，message 为"免费注册，查看精确地址"
- [x] 3.2 联系方式门控：将 contactName/contactPhone/contactWechat 区域用 LoginGate 包裹，message 为"注册后查看联系人和微信"
- [x] 3.3 入驻流程门控：未登录时标题改为"入驻流程（共X步）"，步骤内容用 LoginGate 包裹，message 为"注册后查看完整流程"
- [x] 3.4 配套服务门控：前 2 项直接显示，剩余项用 LoginGate 包裹，message 为"还有X项服务，注册后查看全部"；≤2 项时无需遮罩
- [x] 3.5 政策扶持门控：未登录时显示"🎁 此社区有政策扶持"标签，政策内容用 LoginGate 包裹，message 为"注册后查看政策详情"

## 4. 侧边栏与地图改造

- [x] 4.1 侧边栏 CTA 改造：未登录时替换为注册权益列表卡片（标题、权益清单、注册按钮、登录链接）；已登录时显示"收藏社区"按钮（空 onClick 占位）
- [x] 4.2 地图下方注册提示：仅未登录时显示"📍 注册后查看精确地址和路线"，text-primary 小字，链接到注册页

## 5. 验证

- [x] 5.1 本地验证：未登录状态下访问社区详情页，确认 7 项门控区域均正确显示遮罩和注册引导
- [x] 5.2 本地验证：已登录状态下访问社区详情页，确认所有内容正常显示无遮罩
