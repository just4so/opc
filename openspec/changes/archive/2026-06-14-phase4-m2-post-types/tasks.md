# Phase 4 M2: 帖子类型重设计 + 连带文件联动

## 背景

OPC圈广场帖子类型从 5 种重构为 3 种（SHARE/DEMAND/CHAT）。M1 数据迁移已完成，DEMAND 枚举值已存在于 schema。本 Milestone 负责所有前后台代码联动。

参考文件：
- `projects/phase4-m2-spec.md` — 完整逐文件改动说明
- `CLAUDE.md` — 样式硬约束
- `prisma/schema.prisma` — PostType 枚举（不删旧值，只停止前端使用）

## 设计约束（硬规则）

- 不删除 PostType 枚举中的旧值（COLLAB/HELP/PROGRESS 等），前端仅做 fallback 兼容
- 不引入新 npm 包/动画库
- 只用 tailwind.config.ts 已定义的语义色，不硬编码 hex

---

## Task 1: 发帖页重构

**文件：** `app/(main)/plaza/new/page.tsx`

**改动：**
- POST_TYPES 改为 3 个：`SHARE`（💡分享）/ `DEMAND`（🤝发需求）/ `CHAT`（💬随便聊）
- 删除 PROGRESS 专属字段：milestone 输入框、selectedProjectId 选择器、`/api/user/projects/list` fetch 及相关 state
- 删除 COLLAB 专属字段面板：budgetType/budgetMin/budgetMax/deadline/skills/contactType/contactInfo 的专属条件渲染区块
- 新增「高级选项」折叠区（默认收起），所有类型共享，内容：联系方式（下拉+输入）、预算（下拉+区间）、截止日期、所需技能标签
- 折叠用 `useState` 控制，不引入新库
- 发布后跳转逻辑：DEMAND → `/plaza?tab=posts&type=DEMAND`，SHARE/CHAT → `/plaza/${data.id}`，两者都调 `router.refresh()`

**验收：**
- [x] 页面显示 3 个类型卡片
- [x] PROGRESS/COLLAB 专属 UI 已消失
- [x] 「高级选项」默认收起，点击后展开联系方式/预算/截止日期/技能字段
- [x] 发 DEMAND 帖跳到广场需求列表，发 SHARE/CHAT 帖跳到帖子详情

---

## Task 2: 帖子 API 校验更新

**文件：** `app/api/posts/route.ts`

**改动：**
- POST 请求 `type` 字段校验白名单改为 `['SHARE', 'DEMAND', 'CHAT']`
- 删除 `type === 'COLLAB'` 对 `contactInfo` 的强制必填校验
- 保留 contactInfo/budgetType/budgetMin/budgetMax/deadline/skills 的接收和写入逻辑（高级字段可选，不强校验）
- GET 请求 `?type=` 过滤参数原有逻辑不变（仅更新校验白名单）

**验收：**
- [x] 用 SHARE/DEMAND/CHAT 发帖，API 接受
- [x] 不传 contactInfo 的 DEMAND 帖，API 不报 400

---

## Task 3: 广场 TYPE_TABS + ProductCard 进展标签

**文件：** `components/plaza/plaza-client.tsx`

**改动 A — TYPE_TABS：**
```typescript
const TYPE_TABS = [
  { value: '',       label: '全部' },
  { value: 'SHARE',  label: '分享' },
  { value: 'DEMAND', label: '发需求' },
  { value: 'CHAT',   label: '随便聊' },
]
```

**改动 B — ProductCard props（N7 进展标签）：**
- ProductCard interface 新增 `latestProgressAt?: Date | string | null`
- 卡片底部：14 天内有进展时显示绿色「N天前有更新」标签（`daysSince === 0` 显示「今天有更新」）
- 标签样式：`text-xs text-emerald-600`，前置 `w-1.5 h-1.5 rounded-full bg-emerald-500` 绿点

**验收：**
- [x] 广场帖子 tab 显示 4 个：全部/分享/发需求/随便聊
- [x] 点击「发需求」只显示 DEMAND 类型帖子
- [x] 有近期进展的产品卡片底部显示绿色更新标签

---

## Task 4: 帖子卡片 TYPE_CONFIG 更新

**文件：** `components/plaza/post-card.tsx`

**改动：**
```typescript
const TYPE_CONFIG = {
  SHARE:  { label: '分享',   color: 'bg-green-100 text-green-700' },
  DEMAND: { label: '发需求', color: 'bg-blue-100 text-blue-700' },
  CHAT:   { label: '随便聊', color: 'bg-gray-100 text-gray-600' },
  // 旧数据 fallback（不删，防止历史记录渲染崩溃）
  COLLAB:   { label: '合作',   color: 'bg-purple-100 text-purple-700' },
  HELP:     { label: '求助',   color: 'bg-yellow-100 text-yellow-700' },
  PROGRESS: { label: '进展',   color: 'bg-orange-100 text-orange-700' },
}
```

**验收：**
- [x] SHARE/DEMAND/CHAT 帖子 badge 颜色正确
- [x] 含旧类型的历史帖子不崩溃（有 fallback 配置）
- [x] 未知类型不会出现 undefined 报错（TYPE_CONFIG[type] 有兜底）

---

## Task 5: 后台帖子管理更新

**文件：** `app/admin/posts/page.tsx`

**改动 A — TYPE_CONFIG：**
```typescript
const TYPE_CONFIG = {
  SHARE:  { label: '分享',   color: 'bg-green-100 text-green-700' },
  DEMAND: { label: '需求',   color: 'bg-blue-100 text-blue-700' },
  CHAT:   { label: '随便聊', color: 'bg-gray-100 text-gray-600' },
  // 旧数据兜底
  COLLAB:   { label: '合作',   color: 'bg-purple-100 text-purple-700' },
  HELP:     { label: '求助',   color: 'bg-yellow-100 text-yellow-700' },
  PROGRESS: { label: '进展',   color: 'bg-orange-100 text-orange-700' },
}
```

**改动 B — 筛选下拉：**
```typescript
[
  { value: '', label: '全部类型' },
  { value: 'SHARE',  label: '分享' },
  { value: 'DEMAND', label: '发需求' },
  { value: 'CHAT',   label: '随便聊' },
]
```

**改动 C — 特殊字段展示：**
```typescript
// 改前（依赖类型判断）
{post.type === 'COLLAB' && post.contactInfo && ...}

// 改后（依赖字段是否有值）
{(post.contactInfo || post.budgetType || post.deadline) && ...}
```

**验收：**
- [x] 后台筛选下拉只显示 全部/分享/发需求/随便聊
- [x] 历史帖子 badge 正常（含旧类型）
- [x] 有 contactInfo/budgetType/deadline 的帖子在后台展示对应字段

---

## Task 6: 个人主页帖子过滤清理

**文件：** `components/profile/profile-client.tsx`

**改动：**
```typescript
// 改前
const displayPosts = recentPosts.filter(p => p.type !== 'PROGRESS').slice(0, 3)

// 改后
const displayPosts = recentPosts.slice(0, 3)
```

**验收：**
- [x] 个人主页帖子列表正常显示，无 PROGRESS 过滤逻辑
- [x] 最多显示 3 条最新帖子

---

## Task 7: SSR 查询加入进展数据

**文件：** `lib/queries/plaza.ts`

**改动：**
在 `getPlazaProjects` 函数的 Prisma select 中加入：
```typescript
progress: {
  orderBy: { createdAt: 'desc' },
  take: 1,
  select: { createdAt: true },
},
```
同时更新该函数的 TypeScript 返回类型（如有显式类型）加入 `progress: { createdAt: Date }[]`。

> 注意：该函数带 `unstable_cache`，本地改完后需重启 dev server 才能看到效果。

**验收：**
- [x] `npm run build` 无 TS 报错
- [x] `getPlazaProjects` 返回的 project 对象包含 `progress` 数组
- [x] ProductCard 能从 `progress[0]?.createdAt` 读取最新进展时间

---

## 最终验收

- [x] `npm run build` 无报错
- [x] 发帖页显示 3 个类型（分享/发需求/随便聊），无专属字段面板
- [x] 「高级选项」折叠区默认收起，点击展开
- [x] 发 DEMAND 帖后跳转到 `/plaza?tab=posts&type=DEMAND`
- [x] 发 SHARE/CHAT 帖后跳转到帖子详情页
- [x] 广场 TYPE_TABS 显示 4 个 tab（全部/分享/发需求/随便聊）
- [x] 历史 SHARE/DEMAND 帖子 badge 正常显示
- [x] 后台帖子页筛选下拉更新，badge 正常
- [x] 个人主页帖子列表无过滤异常
- [x] 产品卡片 14 天内有进展时显示绿色更新标签
