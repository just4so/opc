## Context

社区详情页 (`app/(main)/communities/[slug]/page.tsx`) 是纯 Server Component，当前所有信息对匿名访客完全开放。NextAuth v5 的 `auth()` 可在 Server Component 中直接调用获取 session。项目已有 `callbackUrl` 重定向机制（注册后跳回原页面）。

现有页面结构：主内容区（左 2/3）+ 侧边栏（右 1/3），主内容区包含社区简介、入驻政策、真实入驻说明、评价、入驻流程、配套服务；侧边栏包含 CTA 卡片、地图、基本信息、适合人群、注意事项、参考链接。

## Goals / Non-Goals

**Goals:**
- 通过信息门控为未登录用户创造注册动机
- 保持已登录用户体验完全不变
- 提供一致的门控视觉效果（毛玻璃遮罩 + 注册引导）
- 注册按钮携带 `callbackUrl` 实现注册后回到当前页面

**Non-Goals:**
- 付费层/会员层门控（暂不实现）
- 用户收藏功能的完整实现（侧边栏按钮仅占位）
- 门控逻辑的中间件实现（保持页面级判断）

## Decisions

### 1. Server Component 级 auth 判断 vs Client Component 级判断
**选择**: Server Component 中调用 `auth()` 获取 session，计算 `isLoggedIn` boolean 传递给子组件。
**理由**: 避免未登录用户先看到完整内容再闪烁为遮罩（CLS 问题）；Server Component 中 `auth()` 是零成本调用；保持现有 Server Component 架构不变。

### 2. LoginGate 作为通用 Client Component
**选择**: 新建 `components/community/login-gate.tsx` 作为 Client Component。
**理由**: 组件需要处理交互（注册按钮点击），且可能复用于其他页面。接收 `isLoggedIn`、`message`、`registerUrl`、`children` props。未登录时在 children 上叠加毛玻璃遮罩层；已登录时直接渲染 children。

### 3. 门控粒度：整块遮罩 vs 逐字段遮罩
**选择**: 以区块为单位进行遮罩（整个地址区域、整个联系方式区域等），而非逐个字段遮罩。
**理由**: 视觉更整洁；实现更简单；用户一次注册解锁整块内容的体验更好。

### 4. 配套服务的部分展示策略
**选择**: 显示前 2 项，其余用 LoginGate 遮罩。若总数 ≤ 2，无需遮罩。
**理由**: 让用户看到部分价值（服务质量预览），同时留下悬念促进注册。

### 5. 侧边栏 CTA 差异化
**选择**: 未登录时将现有「开启你的AI创业之旅」CTA 替换为注册权益列表卡片；已登录时显示「收藏社区」按钮（空 onClick 占位）。
**理由**: 权益列表直观展示注册价值；已登录用户不需要再看注册引导。

## Risks / Trade-offs

- **SEO 影响**: 被遮罩的内容仍在 HTML 中（Server Component 渲染），搜索引擎仍可索引。遮罩仅是 CSS 视觉层。→ 无 SEO 损失。
- **用户体验摩擦**: 门控可能导致部分用户离开而非注册。→ 通过展示部分内容（服务前 2 项、政策存在性标签）降低摩擦，保持免费层有足够信息价值。
- **内容仍可通过 DevTools 查看**: CSS 遮罩不是真正的访问控制。→ 当前阶段可接受，后续如需真正隐藏可改为 Server Component 条件渲染。
