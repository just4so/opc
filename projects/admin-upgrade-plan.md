# 后台改造任务规划

> 创建时间：2026-05-25
> 状态：待执行
> 项目路径：/Users/wei/Documents/opc

---

## 批次1：权限修正 + 命名统一 + 产品管理补全

### A1. 动态管理权限修正

**文件：** `app/api/admin/posts/route.ts`
- GET 方法：`isAdmin` → `isStaff`

**文件：** `app/api/admin/posts/[id]/route.ts`
- PATCH 方法：`isAdmin` → `isStaff`
- DELETE 方法：`isAdmin` → `isStaff`

---

### A2. 统计数据权限修正

**文件：** `app/api/admin/stats/route.ts`
- `requireAdmin()` → `requireStaff()`
- 注意：requireStaff 同样在内部 redirect，不要用 isStaff 替代

---

### A3. 导出数据权限修正

**文件：** `app/api/admin/export/route.ts`
- GET 方法中 `isAdmin` → `isStaff`
- ⚠️ 只改这一个文件，`export/inquiries/route.ts` 已经是 requireStaff，不动

---

### A4. 用户管理加快捷角色操作按钮

**文件：** `app/admin/users/users-client.tsx`

在用户列表每行的操作列，现有 select 下拉旁边加快捷按钮：
- 当前角色是 USER → 显示「设为版主」按钮（点击 → role: MODERATOR）
- 当前角色是 MODERATOR → 显示「撤销版主」按钮（点击 → role: USER）
- 当前角色是 ADMIN → 不显示任何角色操作按钮
- 按钮样式：小号 outline 按钮，设为版主用蓝色，撤销版主用灰色
- 点击后调用已有的 handleRoleChange 函数，不新增 API
- 只有当前登录者是 ADMIN 时才显示这些按钮（已有 isAdmin 判断）

---

### B. 命名统一

**文件：** `app/admin/layout.tsx`
```
{ href: '/admin/orders', label: '合作管理' }
→
{ href: '/admin/orders', label: '产品管理' }
```
路由路径 /admin/orders 不变。

**文件：** `app/admin/orders/page.tsx`

1. 页面标题 `<h1>` 从「订单管理」→「产品管理」
2. interface `Order` → `ProjectItem`
3. TYPE_OPTIONS 修改：
```typescript
// 改前
{ value: 'DEMAND', label: '需求订单' },
{ value: 'COOPERATION', label: '合作需求' },

// 改后
{ value: '', label: '全部类型' },         // 已有的全部选项不动
{ value: 'PROJECT', label: '我在做' },    // 新增
{ value: 'DEMAND', label: '我需要' },
{ value: 'COOPERATION', label: '我能提供' },
```
4. 表格中 contentType 显示文字：
```typescript
// 改前
order.contentType === 'DEMAND' ? '需求订单' : '合作需求'

// 改后
{ PROJECT: '我在做', DEMAND: '我需要', COOPERATION: '我能提供' }[order.contentType] || order.contentType
```

**文件：** `app/admin/page.tsx`（Dashboard 统计卡片）
```
title: '订单总数' → '广场产品'
```
数值来源 stats.orders 不变（后续 C 改完后数据自然包含三种类型）。

---

### C. 产品管理补全（PROJECT 类型加入）

**文件：** `app/api/admin/orders/route.ts`

核心改动：去掉默认只查 DEMAND/COOPERATION 的限制

```typescript
// 改前
const where: any = { contentType: { in: ['DEMAND', 'COOPERATION'] } }
if (status) where.status = status
if (contentType) where.contentType = contentType
if (search) {
  where.AND = [
    { contentType: { in: ['DEMAND', 'COOPERATION'] } },
    { OR: [...] },
  ]
  delete where.contentType
}

// 改后
const where: any = {}
if (status) where.status = status
if (contentType) where.contentType = contentType
if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { tagline: { contains: search, mode: 'insensitive' } },
  ]
}
// 无 contentType filter 时查全部三种类型，有 filter 时精确筛选
```

**文件：** `app/admin/page.tsx`（getStats 函数）

```typescript
// 改前
prisma.project.count({
  where: { status: 'PUBLISHED', contentType: { in: ['DEMAND', 'COOPERATION'] } },
}),

// 改后
prisma.project.count({
  where: { status: 'PUBLISHED' },
}),
```

---

## 批次2：意向管理加用户跳转 + Dashboard 跳转优化

### D. 意向管理加用户跳转链接

**文件：** `app/api/admin/inquiries/route.ts`

在 `prisma.inquiry.findMany` 的 include 里加上用户信息：
```typescript
include: {
  community: {
    select: { id: true, name: true, slug: true },
  },
  user: {
    select: { username: true },    // 新增
  },
},
```

返回时 `...i` 展开会自动包含 user，无需额外处理。

**文件：** `app/admin/inquiries/inquiries-client.tsx`

1. interface Inquiry 加字段：
```typescript
user?: { username: string } | null
```

2. 称呼列改为可点击，有 username 时加跳转：
```tsx
// 改前
<td className="py-3 pr-4">{inq.name}</td>

// 改后
<td className="py-3 pr-4">
  <div className="flex items-center gap-1.5">
    <span>{inq.name}</span>
    {inq.user?.username && (
      <a
        href={`/profile/${inq.user.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80"
        title="查看广场卡片"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    )}
  </div>
</td>
```

3. ExternalLink 图标已在 lucide-react 中，确认已 import（如没有则加上）

---

### E. Dashboard 跳转优化

**文件：** `app/admin/page.tsx`

现有四个待处理卡片的跳转链接加上状态筛选参数，让点击后自动筛选：

```tsx
// 今日意向卡片
href="/admin/inquiries"
→
href="/admin/inquiries?status=PENDING"

// 待处理认领卡片
href="/admin/communities"
→
href="/admin/communities?tab=claims"
```

⚠️ 需要确认 inquiries-client.tsx 和 communities-client.tsx 是否读取 URL 中的 status/tab 参数来初始化筛选状态，如果没有则顺手加上（从 searchParams 读取并设置初始 state）。

先检查：

---

## 执行前检查清单

已确认：
- inquiries-client.tsx 不读取 URL searchParams，`status` 是纯 state，需要加 useSearchParams 初始化
- communities-client.tsx 不读取 URL searchParams，`activeTab` 是纯 state，需要加 useSearchParams 初始化

因此 E 项需要改两个地方：

**文件：** `app/admin/inquiries/inquiries-client.tsx`

```typescript
// 当前
 const [statusFilter, setStatusFilter] = useState('')

// 改后（从 URL ?status=PENDING 初始化）
'use client'
import { useSearchParams } from 'next/navigation'
// 在组件内加：
const searchParams = useSearchParams()
const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
```

**文件：** `app/admin/communities/communities-client.tsx`

```typescript
// 当前
const [activeTab, setActiveTab] = useState<'list' | 'claims'>('list')

// 改后（从 URL ?tab=claims 初始化）
'use client'
import { useSearchParams } from 'next/navigation'
// 在组件内加：
const searchParams = useSearchParams()
const [activeTab, setActiveTab] = useState<'list' | 'claims'>(
  searchParams.get('tab') === 'claims' ? 'claims' : 'list'
)
```

✅ 两个文件已是 'use client'，直接加 useSearchParams 即可，不需要其他改动。

---

## 验收标准

- [ ] npm run build 通过
- [ ] MODERATOR 角色能进动态管理页并操作
- [ ] MODERATOR 能看到统计数据
- [ ] MODERATOR 能导出数据
- [ ] 侧边栏显示「产品管理」
- [ ] 产品管理能看到三种类型，筛选正常
- [ ] Dashboard「广场产品」数字包含三种类型
- [ ] 意向列表姓名旁有跳转 profile 的图标链接
- [ ] Dashboard 今日意向点击跳到意向管理并筛选 PENDING
- [ ] 用户管理页 ADMIN 能看到「设为版主/撤销版主」快捷按钮
