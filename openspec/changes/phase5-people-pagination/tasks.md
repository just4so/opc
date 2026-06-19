# Phase 5: 创业者 Tab 服务端分页

## 概述

广场「创业者」tab 当前 SSR 只取 20 条数据，客户端过滤/分页导致总页数严重失真（显示 2 页而非 12 页）。本次改造新建 `/api/plaza/users` 服务端分页 API，并改造 `plaza-client.tsx` people tab 接入该 API，同时修复产品列表 `description` 过滤条件误伤空 description 的产品。

---

## Task 列表

### Task 1: 修复产品列表 description 过滤条件

**文件**: `lib/queries/plaza.ts`, `app/api/plaza/projects/route.ts`

**改动**:
- `lib/queries/plaza.ts` — 在 `getPlazaProjects` 的 `where` 条件中，删除 `description: { not: '' }` 这一行
- `app/api/plaza/projects/route.ts` — 同样找到并删除 `description: { not: '' }` 条件（两处保持一致）

**验收**:
- `getPlazaProjects` 和 `/api/plaza/projects` 的 where 条件中不再含有 `description` 过滤
- 广场「产品」tab 首屏可显示未填 description 的已发布产品
- `npm run build` 无 TS 错误

---

### Task 2: 新建 `/api/plaza/users` 路由

**文件**: `app/api/plaza/users/route.ts`（新建）

**改动**:

接口签名：
```
GET /api/plaza/users?page=1&limit=12&location=北京&mainTrack=AI&stage=&search=关键词&sort=latest
```

基础 where 条件（与 `getPlazaUsers` 一致，展示有 bio 或有已发布产品的用户）：
```typescript
const baseWhere = {
  OR: [
    { bio: { not: null } },
    { bio: { not: '' } },
    { projects: { some: { status: 'PUBLISHED' } } },
  ],
}
```

筛选参数处理：
- `location` → `where.location = location`
- `mainTrack` → `where.mainTrack = mainTrack`
- `stage` → `where.startupStage = stage`
- `search` → 用 `AND` 嵌套，避免与基础 OR 冲突：
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

排序：
- `latest`（默认）→ `[{ verified: 'desc' }, { createdAt: 'desc' }]`
- `followers` → `[{ followers: { _count: 'desc' } }, { createdAt: 'desc' }]`

select 字段（与 `getPlazaUsers` 保持一致）：
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

返回格式（与 `/api/plaza/projects` 一致）：
```json
{
  "users": [...],
  "pagination": { "page": 1, "limit": 12, "total": 139, "totalPages": 12 }
}
```

用 `prisma.user.count(where)` 和 `prisma.user.findMany({ where, select, orderBy, skip, take })` 并行查询（`Promise.all`）。

**验收**:
- `GET /api/plaza/users` 返回 200，body 含 `users` 数组和 `pagination` 对象
- `?page=2` 返回第 2 页数据，`pagination.page === 2`
- `?location=北京` 只返回 location 为「北京」的用户
- `?search=ai` 返回 name 或 bio 包含「ai」的用户（不区分大小写）
- `npm run build` 无 TS 错误

---

### Task 3: 改造 `plaza-client.tsx` people tab

**文件**: `components/plaza/plaza-client.tsx`

**改动**:

1. **新增 state**（替换现有 `peoplePage` + 客户端过滤逻辑）：
   ```typescript
   const [people, setPeople] = useState<PlazaUser[]>(initialPlazaUsers)
   const [peoplePagination, setPeoplePagination] = useState({
     page: 1,
     limit: 12,
     total: initialUserTotal,
     totalPages: Math.ceil(initialUserTotal / 12),
   })
   const [peopleLoading, setPeopleLoading] = useState(false)
   ```
   注：`initialUserTotal` 需要从 SSR props 传入（plaza server component 查 `prisma.user.count(baseWhere)` 并传给 PlazaClient）。

2. **新增 `fetchUsers` 函数**（`useCallback`，依赖 filterCity / filterDirection / filterStage / searchQuery / peopleSort）：
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

3. **新增 `useEffect`**（切换 mainTab 到 people，或筛选/搜索/排序变化时，重置到第 1 页并重新拉取）：
   ```typescript
   useEffect(() => {
     if (mainTab !== 'people') return
     fetchUsers(1)
   }, [mainTab, filterCity, filterDirection, filterStage, searchQuery, peopleSort])
   ```

4. **新增翻页处理函数**：
   ```typescript
   const handlePeoplePage = (p: number) => {
     fetchUsers(p)
   }
   ```

5. **删除以下客户端逻辑**（全部移除）：
   - `const PEOPLE_PER_PAGE = 12`（或对应常量）
   - `const filteredUsers = useMemo(() => { ... }, [...])`
   - `const paginatedUsers = useMemo(() => { ... }, [...])`
   - `const peopleTotalPages = Math.ceil(filteredUsers.length / PEOPLE_PER_PAGE)`
   - 原有 `useEffect` 中 `setPeoplePage(1)` 的调用

6. **替换渲染变量**：
   - `paginatedUsers` → `people`
   - `peopleTotalPages` → `peoplePagination.totalPages`
   - `peoplePage` → `peoplePagination.page`
   - `setPeoplePage(p)` → `handlePeoplePage(p)`

7. **UI 修复**：
   - people tab 翻页按钮：`rounded-md` → `rounded-2xl`（符合样式规范）
   - 在 people tab 列表区域加 loading skeleton：参照 products tab 的 skeleton 写法，`peopleLoading` 为 true 时渲染骨架屏

8. **SSR 侧（plaza server component）**：
   - 在 `app/(main)/plaza/page.tsx` 中补充查询 `initialUserTotal`（`prisma.user.count({ where: baseWhere })`）
   - 将 `initialUserTotal` 作为 prop 传给 `PlazaClient`
   - `PlazaClient` 组件签名加 `initialUserTotal: number` prop

**验收**:
- 创业者 tab 翻页，页码根据服务端返回的 `pagination.totalPages` 正确显示（约 12 页，而非 2 页）
- 切换城市/方向/阶段筛选 → 调 `/api/plaza/users` 全量过滤，不再是前端过滤 20 条
- 搜索框输入 → 全量搜索
- 加载时显示 loading skeleton
- people tab 翻页按钮圆角为 `rounded-2xl`
- `npm run build` 无 TS 错误，无类型报错

---

## 执行顺序

1. **Task 1**（1~2 行删除，最简单，先做）
2. **Task 2**（新建 API 路由，独立文件，不影响现有代码）
3. **Task 3**（改造 plaza-client.tsx，依赖 Task 2 的 API）
4. `npm run build` 全量验证

## 全局验收

- [x] 创业者 tab 总页数 ≈ ceil(总用户数 / 12)，不再硬显示 2 页
- [x] 筛选城市/方向/阶段 → 走 API，全量数据生效
- [x] 搜索框 → 走 API，全量搜索
- [x] 加载中有 loading 状态（骨架屏）
- [x] 产品 tab 首屏可见无 description 的已发布产品
- [x] `npm run build` 通过，无 TS 错误
