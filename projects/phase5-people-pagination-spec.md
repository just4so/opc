# Phase 5: 创业者 Tab 服务端分页 Spec

> 问题：广场「创业者」tab 显示总数 139，但翻页只有 2 页（SSR 只取了 20 条，在客户端分页）
> 目标：与「产品」tab 对齐，改为服务端分页，筛选/搜索全量生效

---

## 根本原因

- `lib/queries/plaza.ts` `getPlazaUsers()` 硬编码 `take: 20`，SSR 只取首屏数据
- `plaza-client.tsx` people tab 用 `filteredUsers = initialPlazaUsers.filter(...)` 在客户端过滤这 20 条
- 没有对应的 `/api/plaza/users` API 路由，翻页无处取数据
- `peopleTotalPages = Math.ceil(filteredUsers.length / 12)` 用过滤后长度算页数，只有 2 页

## 解决方案

参照现有 `app/api/plaza/projects/route.ts` 的模式，新建 `app/api/plaza/users/route.ts`，并改造 `plaza-client.tsx` people tab 的分页逻辑。

---

## Task 1: 新建 `/api/plaza/users` 路由

**文件**: `app/api/plaza/users/route.ts`（新建）

**接口**:
```
GET /api/plaza/users?page=1&limit=12&location=北京&mainTrack=AI&stage=&search=关键词&sort=latest
```

**where 条件**（与 `getPlazaUsers` 完全一致）:
```typescript
const baseWhere = {
  OR: [
    { bio: { not: null } },
    { bio: { not: '' } },
    { projects: { some: { status: 'PUBLISHED' } } },
  ],
}
```

**筛选参数**:
- `location` → `where.location = location`
- `mainTrack` → `where.mainTrack = mainTrack`
- `stage` → `where.startupStage = stage`
- `search` → `where.OR` 扩展为 name/bio 模糊匹配（`contains + mode: 'insensitive'`）

注意：`search` 与基础 `OR` 条件不能直接合并，用 `AND` 嵌套：
```typescript
if (search) {
  where.AND = [
    { OR: baseWhere.OR },
    { OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } },
    ]}
  ]
} else {
  where.OR = baseWhere.OR
}
```

**排序**:
- `latest`（默认）→ `[{ verified: 'desc' }, { createdAt: 'desc' }]`
- `followers` → `[{ followers: { _count: 'desc' } }, { createdAt: 'desc' }]`

**select 字段**（与 `getPlazaUsers` 保持一致）:
```typescript
select: {
  id: true,
  username: true,
  name: true,
  avatar: true,
  bio: true,
  location: true,
  mainTrack: true,
  startupStage: true,
  verified: true,
  verifyType: true,
  projects: {
    where: { status: 'PUBLISHED' },
    take: 2,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, description: true, stage: true, website: true },
  },
  _count: {
    select: { followers: true, projects: true },
  },
}
```

**返回格式**（与 projects API 一致）:
```json
{
  "users": [...],
  "pagination": { "page": 1, "limit": 12, "total": 139, "totalPages": 12 }
}
```

---

## Task 2: 改造 `plaza-client.tsx` people tab

**文件**: `components/plaza/plaza-client.tsx`

### 新增 state

```typescript
const [people, setPeople] = useState<PlazaUser[]>(initialPlazaUsers)
const [peoplePagination, setPeoplePagination] = useState({
  page: 1, limit: 12, total: initialUserTotal, totalPages: Math.ceil(initialUserTotal / 12)
})
const [peopleLoading, setPeopleLoading] = useState(false)
```

### 新增 fetchUsers 函数

```typescript
const fetchUsers = useCallback(async (page: number) => {
  setPeopleLoading(true)
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', '12')
  if (filterCity) params.set('location', filterCity)
  if (filterDirection) params.set('mainTrack', filterDirection)
  if (filterStage) params.set('stage', filterStage)
  if (searchQuery) params.set('search', searchQuery)
  if (peopleSort === 'followers') params.set('sort', 'followers')
  try {
    const res = await fetch(`/api/plaza/users?${params}`)
    const data = await res.json()
    setPeople(data.users || [])
    setPeoplePagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 })
  } finally {
    setPeopleLoading(false)
  }
}, [filterCity, filterDirection, filterStage, searchQuery, peopleSort])
```

### 新增 useEffect（筛选/搜索/排序变化时重新拉取第 1 页）

```typescript
useEffect(() => {
  if (mainTab !== 'people') return
  fetchUsers(1)
}, [mainTab, filterCity, filterDirection, filterStage, searchQuery, peopleSort])
```

### 翻页处理

```typescript
const handlePeoplePage = (p: number) => {
  setPeoplePagination(prev => ({ ...prev, page: p }))
  fetchUsers(p)
}
```

### 删除以下客户端过滤逻辑（全部删除）

```typescript
// 删除这些：
const filteredUsers = useMemo(() => { ... }, [...])
const paginatedUsers = useMemo(() => { ... }, [...])
const peopleTotalPages = Math.ceil(filteredUsers.length / PEOPLE_PER_PAGE)
const PEOPLE_PER_PAGE = 12
// 以及 useEffect 里的 setPeoplePage(1)
```

### 替换渲染

- `paginatedUsers` → `people`
- `peopleTotalPages` → `peoplePagination.totalPages`
- `peoplePage` → `peoplePagination.page`
- `setPeoplePage(p)` → `handlePeoplePage(p)`
- 翻页按钮加 `rounded-2xl`（当前用了 `rounded-md`，不符合规范）
- 在 people tab 加 loading skeleton（参照 products tab 的 skeleton 写法）

### uniqueTracks / uniqueCities

目前从 `initialPlazaUsers`（20条）派生，只能看到 20 条里的城市/方向。

改为：从 DB 静态加载（SSR props 里加两个数组），或者保留现有逻辑（仍从 20 条派生——这是次要问题，筛选已走 API 后选项不全的问题影响较小）。

**决策：暂时保留从初始 20 条派生筛选选项**，不增加额外 API 调用。筛选项不全是已知限制，后续再优化。

---

## Task 3: 修复广场产品列表 description 过滤条件

**文件**: `lib/queries/plaza.ts`

`getPlazaProjects` 有 `description: { not: '' }` 条件，导致没填 description 的产品不显示在 SSR 首屏。

改动：删除 `description: { not: '' }` 这一行。

同理检查 `app/api/plaza/projects/route.ts` 是否也有此条件 → 确认也有，一并删除。

---

## 执行顺序

1. Task 3（1行删除，最简单，先做）
2. Task 1（新建 API 路由）
3. Task 2（改造 plaza-client.tsx people tab）
4. `npm run build` 验证

## 验收点

- [ ] 创业者 tab 翻页，页码根据总数 139 正确计算（约 12 页）
- [ ] 切换城市/方向筛选 → 调 API 过滤全量数据，而非前端过滤 20 条
- [ ] 搜索框输入 → 全量搜索
- [ ] 加载时有 loading 状态（骨架屏或 spinner）
- [ ] 产品 tab 首屏显示无 description 的产品（不被过滤掉）
- [ ] `npm run build` 通过
