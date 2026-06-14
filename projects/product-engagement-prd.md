# OPC圈产品粘性升级 PRD

> 创建时间：2026-06-14
> 最后更新：2026-06-14（帖子类型重设计3类型 + 数据库迁移方案 + FAB 关联 + 跳转逻辑确认）
> 状态：待执行
> 项目路径：/Users/wei/Documents/opc
> 背景：通过用户行为数据分析和产品讨论，制定本次升级方案，目标是提升供给侧（创业者发布产品/进展）的活跃度，为后续引入需求方做准备。

---

## 一、遗留任务（来自旧PRD，尚未执行）

### L1：Schema变更（必须最先执行）
**文件：** `prisma/schema.prisma`
在 `model Inquiry` 中加字段：
```prisma
acceptInterview Boolean @default(false)
```
执行：`npx prisma db push`

### L2：直通车表单优化（`components/connect/connect-form.tsx`）
- 微信号 → 手机号（Label + placeholder）
- productTagline 的 Label/placeholder/maxLength 更新为产品描述
- 第二页加「愿意接受官方媒体采访」checkbox（依赖L1）
- 城市列表按首字母分组（SelectGroup + SelectLabel）

### L3：直通车API（`app/api/inquiries/route.ts`）
- 接收 `acceptInterview` 字段
- 创建Project时 `description` 用 `productDescription`（不再留空）

### L4：设置页产品描述（`components/settings/products-section.tsx`）
- newProject state 加 `description` 字段
- 表单加 Textarea（500字限制）

### L5：广场产品卡片加description展示（`components/plaza/plaza-client.tsx`、`app/api/plaza/projects/route.ts`、`app/(main)/plaza/page.tsx`）
- interface 加 description 字段
- 卡片内 description 超80字可展开/收起

### L6：个人主页产品加description（`components/profile/profile-client.tsx` + 对应API）

### L7：后台修复（`app/admin/inquiries/inquiries-client.tsx`、`app/api/admin/export/inquiries/route.ts`）
- 时间改为北京时间
- 加 BP文件列、采访意向列
- CSV导出同步更新

---

## 二、新增任务

---

### N1：注册页社区数量改为动态读取

**文件：** `app/(auth)/register/page.tsx`

**现状：** 左侧文案硬编码「全国 180+ 个 OPC 社区」。

**改动：**
- 将 register page 改为 async server component（目前是 client component，需要拆分：外层 server component 查数据，内层 client component 处理表单）
- 在 server component 里查询：
```typescript
const communityCount = await prisma.community.count({ where: { status: 'ACTIVE' } })
```
- 文案改为：`全国 ${communityCount} 个 OPC 社区，真实信息人工核实`
- 去掉「+」号，直接显示真实数字

**验收：** 数字和DB实际数量一致，每次构建/访问时更新。

---

### N2：广场 Header 区域加「发布产品」按钮

**文件：** `components/plaza/plaza-client.tsx`（PageHeader 区域）

**现状：** PageHeader 里只有「发帖」按钮，跳转 `/plaza/new`。

**改动：**
在「发帖」按钮左侧加「发布产品」按钮：
```tsx
<Link href="/settings#products">
  <Button size="lg" variant="outline" className="gap-2">
    <Package className="h-4 w-4" />
    发布产品
  </Button>
</Link>
```
- 样式：边框按钮（variant="outline"），「发帖」保持主色填充按钮，形成主次关系
- 点击跳转到 `/settings#products`（产品设置页），用户在此发布或管理产品

**验收：** 两个按钮并排，视觉有主次，点击发布产品正确跳转。

---

### N3：帖子类型彻底重设计（一步到位）

**文件：** `app/(main)/plaza/new/page.tsx`、`app/api/posts/route.ts`、`components/plaza/plaza-client.tsx`（TYPE_TABS）、`components/plaza/post-card.tsx`、`prisma/schema.prisma`

**设计原则：** 类型只是「发帖意图」标签，不决定字段。所有可选字段（预算/联系方式/截止日期/技能等）对所有类型开放，收进「高级选项」折叠区，用户需要时自填，不填也能发。

#### 新帖子类型（3个）

| 新类型值 | 显示名 | 含义 | 数据来源 |
|---------|--------|------|----------|
| `SHARE` | 分享 | 经验/资源/工具/进展/随想，正向输出 | 原 CHAT(61) + SHARE(90) + PROGRESS(2) + RESOURCE(1) |
| `DEMAND` | 发需求 | 有问题/任务/预算，需要帮助或合作 | 原 COLLAB(41) + HELP(35) |
| `CHAT` | 随便聊 | 没有明确目的，就是说说 | 新增（历史 CHAT 迁入 SHARE，此为新起点）|

> ⚠️ 注意：历史 CHAT 数据迁入 SHARE，新的 CHAT 类型是全新起点，不影响历史记录。

#### 数据迁移（必须最先执行，早于代码改动）

**Step 1：schema.prisma 新增 DEMAND 枚举值**
```prisma
enum PostType {
  // 现有值保留不删（历史兼容）
  DAILY
  EXPERIENCE
  QUESTION
  RESOURCE
  DISCUSSION
  CHAT
  HELP
  SHARE
  COLLAB
  PROGRESS
  // 新增
  DEMAND
}
```
执行 `npx prisma db push`（只加枚举值，不删，安全）

**Step 2：数据迁移 SQL**
```sql
-- 迁移到 SHARE
UPDATE "Post" SET type = 'SHARE' WHERE type IN ('CHAT', 'PROGRESS', 'RESOURCE');
-- 迁移到 DEMAND
UPDATE "Post" SET type = 'DEMAND' WHERE type IN ('COLLAB', 'HELP');
-- 清理 PROGRESS 专属字段（仅2条，内容无意义）
UPDATE "Post" SET milestone = NULL, "projectId" = NULL
  WHERE milestone IS NOT NULL OR "projectId" IS NOT NULL;
```
执行后验证：`SELECT type, COUNT(*) FROM "Post" GROUP BY type;`
预期结果：SHARE ≈ 244，DEMAND ≈ 76，其余旧类型全部归零

**Step 3：执行完迁移后再执行代码改动**

#### 前端改动

**`app/(main)/plaza/new/page.tsx`：**
- POST_TYPES 改为3个：SHARE「分享」/ DEMAND「发需求」/ CHAT「随便聊」
- 删除所有类型专属字段区块（PROGRESS 的里程碑/关联产品、COLLAB 的专属面板）
- 新增「高级选项」折叠区（所有类型共享，默认收起）：
  - 联系方式（contactType + contactInfo）
  - 预算（budgetType + budgetMin/budgetMax）
  - 截止日期（deadline）
  - 所需技能（skills）
- 发布后跳转逻辑（见「五、跳转逻辑」章节）

**`app/api/posts/route.ts`：**
- type 校验枚举值改为：`['SHARE', 'DEMAND', 'CHAT']`
- 删除 `type === 'COLLAB'` 的 contactInfo 强制校验
- 其余字段处理逻辑不变（高级字段照常接收，不强校验）

**`components/plaza/plaza-client.tsx`：**
- TYPE_TABS 改为：
  ```typescript
  const TYPE_TABS = [
    { value: '',       label: '全部' },
    { value: 'SHARE',  label: '分享' },
    { value: 'DEMAND', label: '发需求' },
    { value: 'CHAT',   label: '随便聊' },
  ]
  ```

**`components/plaza/post-card.tsx`：**
- TYPE_CONFIG 同步更新为3个类型，删除 COLLAB/HELP/PROGRESS 的 badge 配置

**验收：** 发帖页显示3个类型，无专属字段面板，高级选项可折叠；历史帖子（SHARE/DEMAND）正常展示；筛选 tab 正常工作。

---

### N4：右下角悬浮区升级为 Speed Dial 菜单

**文件：** 找到现有帮助按钮所在组件（检索 `floating` 或全局 layout），在此基础上扩展。

**改动：**
将现有帮助按钮升级为可展开的 Speed Dial FAB：

```
默认：右下角一个橙色圆形按钮（图标：+ 或 Zap）
点击后向上展开3个小按钮（带文字标签）：
  ↑ [📦 发布产品/需求]  → 点击后弹出两个选项：「发布产品」(→/settings#products) / 「发布需求」(→/plaza/new?type=DEMAND)
  ↑ [👥 加入社群]       → 弹窗显示微信二维码（从SiteSetting读取 `community_qrcode_url` 字段）
  ↑ [❓ 帮助]           → 现有逻辑不变
点击遮罩或再次点击主按钮收起
```

**实现要点：**
- 「加入社群」弹窗：读取 `community_qrcode_url`（key 已在 SiteSetting 中存在），通过 `/api/public/settings?key=community_qrcode_url` 获取图片 URL，展示二维码图片
- 展开/收起用 CSS transform + opacity 动画，不用第三方库
- 小按钮样式：白色背景 + 阴影 + 橙色图标，右侧有文字标签
- 移动端和PC端均显示

**验收：** 右下角FAB点击展开3个选项，功能各自正常，动画流畅。

---

### N5：直通车成功页引导优化

**文件：** `components/connect/success-view.tsx`、`components/connect/connect-form.tsx`

**现状：** 直通车提交后自动创建Project（已实现），但成功页两个引导（「去广场」/「完善卡片」）没有针对「已发布产品」的路径。

**改动：**

1. `connect-form.tsx`：submitInquiry 成功后拿到 `projectId`，传给 SuccessView：
```tsx
// 改前
<SuccessView qrcodeUrl={qrcodeUrl} />
// 改后
<SuccessView qrcodeUrl={qrcodeUrl} projectSlug={result.projectSlug} />
```
（API返回值需同时返回 projectSlug，在 inquiries/route.ts 里查询并返回）

2. `success-view.tsx` 接收 `projectSlug?: string`，动态显示引导：

**有产品时（填了产品名）：**
```
✅ 你的产品已发布到创业广场
[去广场看看你的产品 →]   ← href="/projects/{projectSlug}"
[完善产品详情，吸引更多关注 →]  ← href="/settings#products"
[添加客服，获取审核结果]  ← 二维码（现有）
```

**无产品时（未填产品名）：**
```
[去广场看看其他创业者 →]   ← 现有
[发布你的产品到广场 →]     ← href="/settings#products"（替换「完善卡片」）
[添加客服，获取审核结果]  ← 二维码（现有）
```

**验收：** 填了产品名的情况下，成功页显示「你的产品已发布」引导；未填时显示「去发布产品」引导。

---

### N6：产品详情页本人视角加「+ 发布进展」按钮

**文件：** `components/projects/project-detail-client.tsx`

**现状：** 进展（Progress）区域只展示历史进展，无发布入口。settings页的进展弹框（progress-dialog.tsx）可复用。

**改动：**
- 进展区域底部（本人查看时），加「+ 发布新进展」按钮
- 点击弹出 `ProgressDialog`（从 `components/settings/progress-dialog.tsx` 引入，传入 projectId 和 projectName）
- 发布成功后刷新进展列表（调用 router.refresh() 或本地state更新）

**注意：** 检查 progress-dialog.tsx 的 props 定义，确认可以直接复用还是需要小改。

**验收：** 本人查看自己的产品详情页时，进展区域有「+ 发布新进展」按钮；非本人不显示。

---

### N7：产品卡片和详情页加「最近有进展」标签

**文件：** `components/plaza/product-card.tsx`、`components/projects/project-detail-client.tsx`、`app/api/plaza/projects/route.ts`、`app/(main)/plaza/page.tsx`

**改动A：广场产品卡片**
- API 和 SSR 查询加 `progress: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }`
- product-card.tsx 的 ProductCard props 加 `latestProgressAt?: Date`
- 卡片底部加标签：14天内有进展时显示「● X天前有更新」（绿色小点+文字）；超过14天不显示

**改动B：产品详情页**
- 产品名下方加一行小字：有进展时显示「最近更新：X天前」，无进展时不显示

**验收：** 广场卡片上有进展标签，详情页有最近更新提示。

---

### N8：产品被查看通知owner

**文件：** `lib/notifications.ts`、产品详情页的数据获取处（`app/(main)/projects/[slug]/page.tsx`）

**改动：**

1. `lib/notifications.ts` 新增函数：
```typescript
export async function createProjectViewedNotification(
  ownerId: string,
  visitorName: string,
  visitorId: string,
  projectSlug: string,  // 存 slug，不存 projectId
  projectName: string
) {
  // 24小时内同一访客同一产品不重复通知
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: ownerId,
      type: 'PROJECT_VIEWED',
      relatedId: projectSlug,  // 存 slug，通知面板直接拼接跳转 URL
      content: visitorId,
      createdAt: { gt: since },
    },
  })
  if (existing) return null

  return createNotification({
    userId: ownerId,
    type: 'PROJECT_VIEWED',
    title: `${visitorName || '有人'}查看了你的产品「${projectName}」`,
    content: visitorId,
    relatedId: projectSlug,  // 存 slug，通知面板直接拼接跳转 URL
  })
}
```

2. `app/(main)/projects/[slug]/page.tsx`：
   - 有登录用户 + 非本人查看时，调用 `createProjectViewedNotification`
   - 未登录用户不触发（避免爬虫刷通知）

3. `components/notifications/notification-panel.tsx`：
   - 加 `PROJECT_VIEWED` 类型的图标映射（用 Eye 图标，和 CARD_VIEWED 一致）
   - 加对应的文案渲染逻辑

**验收：** 非本人访问产品详情页时，owner收到通知；24小时内同一访客不重复。

---

### N9：Welcome页加产品发布引导

**文件：** `app/(auth)/welcome/page.tsx`

**现状：** Welcome页有推荐社区、热门产品、三个快捷入口（广场/找社区/完善主页）。

**改动：**
在三个快捷入口区域，将「完善主页」入口改为「发布你的产品」：
```tsx
// 改前
href="/settings#card"
图标：Zap
标题：完善主页
描述：让创业者认识你

// 改后
href="/settings#products"
图标：Rocket（或 Package）
标题：发布你的产品
描述：让1000+创业者看见你在做什么
```

**理由：** 「发布产品」比「完善主页」对用户的行动指向更明确，且与核心目标（供给侧增长）直接对应。

**验收：** Welcome页第三个快捷入口指向产品发布，点击正确跳转。

---

## 五、跳转逻辑（发布后行为）

| 入口 | 类型 | 发布后跳转 | 理由 |
|------|------|-----------|------|
| 广场 Header「发布产品」按钮 / FAB「发布产品」/ Welcome页入口 | — | 停留在 `/settings#products`，产品列表刷新 | settings 是产品管理中心，发完可继续补充 |
| FAB「发布需求」/ 发帖页 DEMAND 类型 | DEMAND | 跳转 `/plaza?tab=posts&type=DEMAND` | 给用户即时反馈「发出去了，别人能看见」 |
| 发帖页 SHARE 类型 | SHARE | 跳转到帖子详情页 `/plaza/{postId}` | 与现有逻辑一致 |
| 发帖页 CHAT 类型 | CHAT | 跳转到帖子详情页 `/plaza/{postId}` | 与现有逻辑一致 |
| 产品详情页「+ 发布进展」按钮 | Progress | 关闭弹框，进展列表原地刷新，停留在产品详情页 | 用户在看自己的产品，发完待在这里是自然的 |
| 直通车成功页（有产品） | — | 引导链接「去广场看看你的产品」→ `/projects/{slug}` | — |
| 直通车成功页（无产品） | — | 引导链接「发布你的产品」→ `/settings#products` | — |

**代码实现要点（`app/(main)/plaza/new/page.tsx`）：**
```typescript
// 发帖成功后
if (type === 'DEMAND') {
  router.push('/plaza?tab=posts&type=DEMAND')
} else {
  router.push(`/plaza/${data.id}`)  // 帖子详情页
}
router.refresh()
```

---

## 六、连带影响清单（必须同步修改，否则报错）

### 后台帖子管理页（`app/admin/posts/page.tsx`）

**问题：** TYPE_CONFIG 和筛选下拉仍是旧的5个类型，迁移后 badge 全显示空白。

**改动：**
- TYPE_CONFIG 更新为3个类型：
  ```typescript
  SHARE:  { label: '分享',  color: 'bg-green-100 text-green-700' },
  DEMAND: { label: '需求',  color: 'bg-blue-100 text-blue-700' },
  CHAT:   { label: '随便聊', color: 'bg-gray-100 text-gray-700' },
  ```
- 筛选下拉同步更新为3个类型
- `post.type === 'COLLAB'` 的特殊字段展示逻辑改为 `post.contactInfo || post.budgetType || post.deadline` 时展示（不再依赖类型判断）

### 个人主页帖子过滤（`components/profile/profile-client.tsx:151`）

**问题：** `recentPosts.filter(p => p.type !== 'PROGRESS')` — 迁移后 PROGRESS 不再存在，这行是死代码，但如果后续新 CHAT 类型被误过滤会有 bug。

**改动：** 删除这行过滤，直接 `.slice(0, 3)`。

### `app/api/public/settings/route.ts` 白名单

**问题：** PUBLIC_KEYS 目前只有 `['help_qrcode_url']`，FAB「加入社群」需要读 `community_qrcode_url`，不在白名单内会报 400。

**改动：**
```typescript
const PUBLIC_KEYS = ['help_qrcode_url', 'community_qrcode_url']
```

### N7 产品进展标签 — SSR 查询路径（`lib/queries/plaza.ts`）

**问题：** 广场首屏走 SSR，数据来自 `getPlazaProjects()`（在 `lib/queries/plaza.ts`，带缓存）。如果只改 `app/api/plaza/projects/route.ts`（客户端分页接口），SSR 首屏拿不到 `latestProgressAt`，会出现首屏无标签、客户端刷新后才出现的闪烁。

**改动：** `lib/queries/plaza.ts` 的 `getPlazaProjects` 查询里同步加入：
```typescript
progress: {
  orderBy: { createdAt: 'desc' },
  take: 1,
  select: { createdAt: true },
},
```
同时更新 `plaza/page.tsx` 传给 `PlazaClient` 的 `initialProjects` 数据结构，以及 `components/plaza/plaza-client.tsx` 里 `ProductCard` 的 props interface。

### N2「发布产品」按钮 — 未登录行为

未登录用户点击「发布产品」按钮正常显示和跳转，跳到 `/settings#products` 后由 middleware/settings 页面的 auth 守卫自动重定向到登录页，**无需在按钮层面做额外处理**，和「发帖」按钮保持一致。

### N8 PROJECT_VIEWED 通知 — relatedId 存 slug

**决策：** relatedId 存 `projectSlug`（非 projectId），原因：通知面板 `getNavTarget()` 直接用 `relatedId` 拼接跳转 URL，存 slug 可以直接 `/projects/${n.relatedId}`，无需额外查询。

**改动点：**
1. `lib/notifications.ts` 新增函数签名接收 `projectSlug`，relatedId 传 slug
2. `components/notifications/notification-panel.tsx`：
   - ICON_MAP 加 `PROJECT_VIEWED: Eye`
   - `getNavTarget()` 加 case：`case 'PROJECT_VIEWED': return n.relatedId ? \`/projects/${n.relatedId}\` : '/plaza'`
3. 调用方 `app/(main)/projects/[slug]/page.tsx` 需要传入 `projectSlug`

---

## 三、执行顺序

```
第一步：L1（schema.prisma 加 acceptInterview 字段）
    ↓
第二步：N3-Step1（schema.prisma 加 DEMAND 枚举值）→ npx prisma db push
    ↓
第三步：N3-Step2（数据迁移 SQL：CHAT/PROGRESS/RESOURCE→SHARE，COLLAB/HELP→DEMAND）
    ↓
第四步：所有代码改动（L2-L7 + N1-N9）可一次性执行
    ↓
第五步：npm run build 验证
    ↓
第六步：本地跑起来截图验证视觉效果
    ↓
commit（不 push，等阿良哥确认）
```

---

## 四、验收清单

### Bug修复
- [ ] 注册页左侧社区数量为DB实时数字
- [ ] 后台时间显示北京时间
- [ ] 后台有BP文件列、采访意向列
- [ ] CSV导出包含BP和采访意向列

### 直通车优化
- [ ] 联系方式改为手机号
- [ ] 城市列表按首字母分组
- [ ] 产品描述字段更新
- [ ] 第二页有「愿意接受采访」checkbox
- [ ] 成功页有产品时显示「产品已发布」引导
- [ ] 成功页无产品时显示「去发布产品」引导

### 广场优化
- [ ] Header有「发布产品」和「发帖」两个按钮，视觉有主次
- [ ] 发帖页显示3个类型（分享/发需求/随便聊），高级选项可折叠
- [ ] 历史帖子已迁移：CHAT/PROGRESS/RESOURCE→SHARE，COLLAB/HELP→DEMAND
- [ ] 产品卡片有「X天前有更新」标签（14天内）
- [ ] 产品详情页有「最近更新」小字

### 右下角FAB
- [ ] 点击展开3个选项（发布/加入社群/帮助）
- [ ] 「发布」展开后有产品和需求两个选项
- [ ] 「加入社群」弹窗显示二维码
- [ ] 帮助功能保持原有

### 产品功能
- [ ] 产品详情页本人视角有「+ 发布进展」按钮
- [ ] 进展发布弹框正常工作
- [ ] 非本人查看产品详情页，owner收到通知
- [ ] 通知面板正确显示PROJECT_VIEWED类型

### Welcome页
- [ ] 第三个快捷入口改为「发布你的产品」

### 后台 & 联动
- [ ] 后台帖子管理页 TYPE_CONFIG 和筛选更新为3个类型
- [ ] 后台帖子特殊字段展示不再依赖 type === 'COLLAB'
- [ ] 个人主页 recentPosts 过滤逻辑删除 `!== 'PROGRESS'` 判断
- [ ] `app/api/public/settings/route.ts` PUBLIC_KEYS 加入 `community_qrcode_url`
- [ ] N8 通知 relatedId 存 slug，通知面板加 PROJECT_VIEWED 类型处理

### 全局
- [ ] `npm run build` 无报错
- [ ] 所有新增字段的 select 查询已同步更新（尤其是 N7 的 `lib/queries/plaza.ts`）
