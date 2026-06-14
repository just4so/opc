# Phase 4 M2: 帖子类型重设计 + 连带文件联动

> Milestone: M2
> 状态: 待执行（M1 完成后执行）
> PRD 章节参考: 二·N3、六·连带影响清单

---

## 任务目标

将广场帖子体系从 5 个类型彻底重构为 3 个类型（SHARE/DEMAND/CHAT），同时同步所有受影响的前后台文件，确保无死角。

---

## 涉及文件清单（必须全部改动，缺一不可）

1. `app/(main)/plaza/new/page.tsx` — 发帖页（核心改动）
2. `app/api/posts/route.ts` — 帖子 API
3. `components/plaza/plaza-client.tsx` — 广场 TYPE_TABS + ProductCard props
4. `components/plaza/post-card.tsx` — 帖子 badge TYPE_CONFIG
5. `app/admin/posts/page.tsx` — 后台帖子管理（连带影响）
6. `components/profile/profile-client.tsx` — 个人主页过滤（连带影响）
7. `lib/queries/plaza.ts` — SSR 查询（N7 进展标签 SSR 数据）

---

## 逐文件改动说明

### 1. `app/(main)/plaza/new/page.tsx`

**改动目标：** POST_TYPES 改为 3 个，删除类型专属字段面板，新增「高级选项」折叠区。

**POST_TYPES 新定义：**
```typescript
const POST_TYPES = [
  { 
    value: 'SHARE', 
    label: '分享', 
    description: '经验/资源/工具/随想，正向输出',
    icon: '💡'
  },
  { 
    value: 'DEMAND', 
    label: '发需求', 
    description: '有任务/预算，需要帮助或合作',
    icon: '🤝'
  },
  { 
    value: 'CHAT', 
    label: '随便聊', 
    description: '没有明确目的，就是说说',
    icon: '💬'
  },
]
```

**删除的内容：**
- PROGRESS 类型的里程碑输入框（milestone）
- PROGRESS 类型的关联产品选择器（projectId + `/api/user/projects/list` fetch）
- COLLAB 类型的专属字段面板（budgetType/budgetMin/budgetMax/deadline/skills/contactType/contactInfo 的专属展示区块）
- 相关 state（milestone、selectedProjectId 等 PROGRESS/COLLAB 专属状态）

**新增「高级选项」折叠区：**
- 默认收起，点击「高级选项 ▼」展开
- 所有类型共享此区块，内容：
  ```
  联系方式：
    [下拉: 微信/手机/邮件] [输入框]
  预算：
    [下拉: 面议/固定/时薪] [最小值] ~ [最大值]（可选）
  截止日期：[日期选择]（可选）
  所需技能：[标签输入]（可选）
  ```
- 折叠区用 `<details>` 原生元素或 state + 动画，不引入新库

**发布后跳转逻辑：**
```typescript
if (type === 'DEMAND') {
  router.push('/plaza?tab=posts&type=DEMAND')
} else {
  router.push(`/plaza/${data.id}`)
}
router.refresh()
```

### 2. `app/api/posts/route.ts`

**改动目标：** 校验逻辑对齐新类型。

- `type` 校验：`['SHARE', 'DEMAND', 'CHAT']`（POST 请求写入校验）
- 删除 `type === 'COLLAB'` 对 `contactInfo` 的强制必填校验
- 保留 contactInfo/budgetType/budgetMin/budgetMax/deadline/skills 的接收和写入逻辑（高级字段照常接收，不强校验）
- GET 请求的 `?type=` 过滤参数继续支持 SHARE/DEMAND/CHAT（原有逻辑不变，只更新校验白名单）

### 3. `components/plaza/plaza-client.tsx`

**改动 A：TYPE_TABS**
```typescript
const TYPE_TABS = [
  { value: '',       label: '全部' },
  { value: 'SHARE',  label: '分享' },
  { value: 'DEMAND', label: '发需求' },
  { value: 'CHAT',   label: '随便聊' },
]
```

**改动 B：ProductCard props（N7 进展标签）**
- ProductCard 组件 props interface 新增 `latestProgressAt?: Date | string | null`
- 卡片底部：
  ```typescript
  // 14天内有进展时显示标签
  const daysSince = latestProgressAt 
    ? Math.floor((Date.now() - new Date(latestProgressAt).getTime()) / 86400000)
    : null
  {daysSince !== null && daysSince <= 14 && (
    <span className="text-xs text-emerald-600 flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      {daysSince === 0 ? '今天有更新' : `${daysSince}天前有更新`}
    </span>
  )}
  ```

### 4. `components/plaza/post-card.tsx`

**改动：TYPE_CONFIG 更新**
```typescript
const TYPE_CONFIG = {
  SHARE:  { label: '分享',   color: 'bg-green-100 text-green-700' },
  DEMAND: { label: '发需求', color: 'bg-blue-100 text-blue-700' },
  CHAT:   { label: '随便聊', color: 'bg-gray-100 text-gray-600' },
  // 兼容旧数据（不会出现但保留防止 undefined 报错）
  COLLAB:   { label: '合作',   color: 'bg-purple-100 text-purple-700' },
  HELP:     { label: '求助',   color: 'bg-yellow-100 text-yellow-700' },
  PROGRESS: { label: '进展',   color: 'bg-orange-100 text-orange-700' },
}
```
> 旧类型保留 fallback 配置，防止历史数据渲染崩溃。

### 5. `app/admin/posts/page.tsx`

**改动 A：TYPE_CONFIG（管理后台 badge）**
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

**改动 B：筛选下拉选项**
```typescript
// 筛选 options 改为
[
  { value: '', label: '全部类型' },
  { value: 'SHARE',  label: '分享' },
  { value: 'DEMAND', label: '发需求' },
  { value: 'CHAT',   label: '随便聊' },
]
```

**改动 C：特殊字段展示逻辑**
```typescript
// 改前（依赖类型判断）
{post.type === 'COLLAB' && post.contactInfo && ...}

// 改后（依赖字段是否有值）
{(post.contactInfo || post.budgetType || post.deadline) && ...}
```

### 6. `components/profile/profile-client.tsx`

**改动：删除 PROGRESS 过滤**

找到 `recentPosts.filter(p => p.type !== 'PROGRESS')` 这行，删除 `.filter(...)` 部分，直接 `.slice(0, 3)`：
```typescript
// 改前
const displayPosts = recentPosts.filter(p => p.type !== 'PROGRESS').slice(0, 3)

// 改后
const displayPosts = recentPosts.slice(0, 3)
```

### 7. `lib/queries/plaza.ts`

**改动：`getPlazaProjects` 查询加入 progress 数据**

在 `getPlazaProjects` 函数的 Prisma 查询 `select` 中，找到 project 的 include/select 部分，加入：
```typescript
progress: {
  orderBy: { createdAt: 'desc' },
  take: 1,
  select: { createdAt: true },
},
```

同时更新该函数的 TypeScript 返回类型（如有显式类型定义）加入 `progress: { createdAt: Date }[]`。

> 这确保 SSR 首屏就有进展数据，不需要等客户端二次 fetch。

---

## 验收标准

- [ ] `npm run build` 无报错
- [ ] 发帖页显示 3 个类型（分享/发需求/随便聊），无专属字段面板
- [ ] 「高级选项」折叠区默认收起，点击可展开
- [ ] 发 DEMAND 帖后跳转到 `/plaza?tab=posts&type=DEMAND`
- [ ] 发 SHARE/CHAT 帖后跳转到帖子详情页
- [ ] 广场 TYPE_TABS 显示 4 个 tab（全部/分享/发需求/随便聊）
- [ ] 历史 SHARE/DEMAND 帖子 badge 正常显示
- [ ] 后台帖子页筛选下拉更新，badge 正常显示
- [ ] 个人主页帖子列表无过滤异常
- [ ] 产品卡片 14天内有进展时显示绿色标签

---

## ⚠️ 注意事项

1. M2 必须在 M1（数据迁移）完成后执行，否则 API 校验会拒绝现有帖子的类型值
2. `lib/queries/plaza.ts` 是带 `unstable_cache` 的函数，改完后本地 dev server 可能需要重启才能看到效果
3. 不要删除 PostType 枚举中的旧值，只是前端不再使用它们
