# OPC 政策库功能 Spec

## 目标

让用户感知到「opcquan.com 的 OPC 政策信息是全国最全的」。
维护者能方便地在后台增删改政策，长期低成本维护。

---

## 设计原则

- **不做独立政策库入口**：不在导航加「政策库」，用户没有主动搜政策的习惯
- **让现有功能更好用**：政策数据服务于社区详情页、创业资讯页
- **SEO 优先**：政策关键词融入页面 metadata，让用户通过搜索引擎找到

---

## 一、数据层：新增 Policy 模型

在 `prisma/schema.prisma` 末尾追加：

```prisma
model Policy {
  id         String       @id @default(cuid())
  province   String                          // 省份，不带后缀，如"北京"
  city       String?                         // 城市，不带后缀，如"北京"；省级政策留 null
  district   String?                         // 区县，带后缀，如"海淀区"；市级/省级政策留 null
  title      String                          // 政策名称
  summary    String                          // 核心扶持要点，100字以内
  sourceUrl  String?                         // 原文链接（可选）
  status     PolicyStatus @default(ACTIVE)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  @@index([city])
  @@index([province])
  @@index([status])
}

enum PolicyStatus {
  ACTIVE    // 已发布/已实施
  DRAFT     // 征求意见稿
  EXPIRED   // 已过期
}
```

**字段归一化规则（重要）：**
- `province`：去掉「市/省/自治区」后缀，如「北京市」→「北京」，「浙江省」→「浙江」
- `city`：同上去后缀，如「杭州市」→「杭州」；直辖市 province=city=「北京」
- `district`：保留「区/县/开发区/高新区/新片区/园区」等后缀，如「海淀区」、「滨江高新区」
- 省级政策：city=null, district=null
- 市级政策：city=省份同名或城市名, district=null
- 区县级政策：city+district 都填

执行：
```bash
npm run db:push
npm run db:generate
```

---

## 二、数据导入脚本

新建 `scripts/import-policies.ts`。

**数据来源**：`/Users/wei/Desktop/全国OPC专项政策全文汇编.md` 的索引表格（从 `| 序号 |` 行开始的 markdown table）。

**字段映射**：
| md 列 | Policy 字段 | 处理规则 |
|-------|------------|---------|
| 省份 | province | 去「市/省/自治区」后缀 |
| 省份 | city | 同上（直辖市省市同名） |
| 地区 | district / city 修正 | 含「区/县/开发区/高新区/新片区/园区/科学城」→ district；含「市」且非直辖市 → 修正 city；「市级」「省级」→ district=null |
| 政策名称 | title | 直接使用 |
| 核心扶持 | summary | 直接使用 |
| 状态 | status | 含「征求意见」→ DRAFT；其余 → ACTIVE |

**过滤规则**：相关度为「弱」的条目跳过。

**幂等**：导入前 `deleteMany` 清空，确保可重复执行。

**运行**：
```bash
npx tsx scripts/import-policies.ts
```

---

## 三、后台管理

### 3.1 政策列表页 `app/admin/policies/page.tsx`

Server Component，`force-dynamic`，调用 `requireStaff()`。

- 展示所有政策，默认按 province → city → district 排序
- 顶部筛选：省份下拉（从 DB 动态取去重列表）+ 状态筛选
- 表格列：省份、城市、区县、政策名称（截断50字）、状态 badge、编辑/删除操作
- 右上角「+ 新增政策」按钮
- 底部显示「共 X 条政策，覆盖 X 个城市」

状态 badge：ACTIVE→绿色、DRAFT→黄色、EXPIRED→灰色

### 3.2 新增/编辑表单

- 新增：`app/admin/policies/new/page.tsx`
- 编辑：`app/admin/policies/[id]/edit/page.tsx`
- 共用：`app/admin/policies/policy-form.tsx`（Client Component）

表单字段：
- 省份（文本，必填，placeholder="如：北京，不加「市」"）
- 城市（文本，必填，placeholder="如：北京，直辖市填与省份相同；省级政策留空"）
- 区县（文本，可选，placeholder="如：海淀区，市级政策留空"）
- 政策名称（文本，必填）
- 核心扶持摘要（textarea，必填，placeholder="面向用户的一句话说明，100字以内"）
- 原文链接（文本，可选）
- 状态（Select：已发布 / 征求意见 / 已过期）

### 3.3 API 路由

- `app/api/admin/policies/route.ts`：GET（列表）、POST（新增）
- `app/api/admin/policies/[id]/route.ts`：PATCH（编辑）、DELETE（删除）
- 所有路由调用 `requireStaff()`

### 3.4 后台导航入口

在后台侧边栏或导航中，「社区管理」后加「政策管理」，链接 `/admin/policies`，图标 `FileText`（lucide-react）。

### 3.5 Dashboard 统计卡片

在 `app/admin/page.tsx` 的 `getStats()` 中追加：
```typescript
prisma.policy.count({ where: { status: { not: 'EXPIRED' } } })
```

在统计卡片列表加一张：
- 标题：「政策总数」
- 图标：`FileText`，颜色 `text-teal-600`，背景 `bg-teal-50`
- extra：「覆盖 X 个城市」（`SELECT COUNT(DISTINCT city) FROM Policy WHERE status != 'EXPIRED'`，用 `prisma.policy.groupBy` 实现）

---

## 四、社区详情页侧边栏联动

文件：`app/(main)/communities/[slug]/page.tsx`

### 4.1 查询逻辑

新增 `getLocalPolicies(city, district)` 函数：

```typescript
async function getLocalPolicies(city: string, district: string | null) {
  return prisma.policy.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        // 区县级：精确匹配
        ...(district ? [{ city, district }] : []),
        // 市级：同城无区县
        { city, district: null },
        // 省级：无城市（province 匹配 city 字段，因直辖市省市同名）
        { city: null, province: city },
      ],
    },
    orderBy: [
      // 区县级优先，其次市级，再次省级
      { district: 'desc' },
      { city: 'desc' },
      { createdAt: 'asc' },
    ],
    take: 5,
  })
}
```

在 `CommunityDetailPage` 中调用（与 `getCommunity` 并行）：
```typescript
const [community, localPolicies] = await Promise.all([
  getCommunity(params.slug),
  // community 查出后再调，或先拿 city/district 做两步查询
])
```

实际上需先查社区拿 city/district，再查政策，两步串行可接受。

### 4.2 侧边栏卡片

位置：「联系信息」卡片和二维码卡片之间。

当 `localPolicies.length > 0` 时渲染，否则不渲染。

UI 结构：
```
┌──────────────────────────────────────┐
│ 📋 本地政策支持                        │
│                                      │
│ [区级] 全面打造OPC创业生态的若干措施     │
│ 创业资金+模型券+安居补贴               │
│                                      │
│ [市级] 市场监管领域OPC创新举措          │
│ 注册便利化系列措施                     │
│                                      │
│ 查看全部政策 →（链接到资讯页政策tab）    │
└──────────────────────────────────────┘
```

每条政策显示：
- 级别标签：district 有值→「区级」，city 有值 district 无→「市级」，city 无→「省级」；用小 badge 区分
- 政策名称（截断28字，超出省略号）
- 摘要（截断40字）
- 若有 sourceUrl，名称右侧显示「↗」外链图标

「查看全部政策」链接到 `/news?category=POLICY`（创业资讯的政策 tab）。

### 4.3 SEO 优化

在 `generateMetadata` 中，当社区有关联政策时，将政策标题关键词追加到 description：
```
描述... | 当地OPC政策：海淀区OPC创业生态举措、北京市场监管OPC创新举措
```

---

## 五、创业资讯页政策展示

创业资讯页（`/news`）已有 category 筛选，现有类别包含 `POLICY`（政策资讯）。

当前 POLICY tab 展示的是 News 表里 category=POLICY 的文章。

**扩展方案**：在 POLICY tab 下方（或上方）加一个「专项政策」区块，展示 Policy 表数据。

### 5.1 修改 `app/(main)/news/page.tsx`

当 `searchParams.category === 'POLICY'`（或无筛选时默认展示全部），在页面顶部加「专项政策」区块：

```
┌─────────────────────────────────────────┐
│ 📋 专项政策  共 109 条，覆盖 30+ 城市     │
│                                         │
│ [省份筛选 tab：全部 北京 上海 江苏 浙江…] │
│                                         │
│ ┌──────────────┐ ┌──────────────┐       │
│ │ 北京 · 海淀区 │ │ 上海 · 徐汇区│       │
│ │ 政策名称...   │ │ 政策名称...  │       │
│ │ 摘要一句话    │ │ 摘要一句话   │       │
│ │ [已发布] [↗] │ │ [征求意见]   │       │
│ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────┘
```

具体实现：
- Server Component 直接查 Policy 表，传给 `PoliciesBlock` Client Component
- 省份筛选用 URL searchParams（`?policyProvince=北京`）驱动，Server Component 处理
- 卡片点击：有 sourceUrl 则新标签打开原文；无 sourceUrl 则不可点（或 cursor-default）
- 仅在 `/news` 页（不限定 category）或 `category=POLICY` 时展示此区块；其他 category tab 下隐藏

---

## 六、验收标准

1. `npx tsc --noEmit` 零错误，`npm run build` 成功
2. 导入脚本跑完后 Policy 表有 90+ 条记录，city 字段无「市」后缀
3. 后台 `/admin/policies` 可正常增删改，Dashboard 有「政策总数」卡片
4. 访问北京海淀区某社区详情页，侧边栏出现本地政策卡片，显示区级+市级政策
5. 访问没有政策数据的城市社区，侧边栏不显示政策卡片
6. 访问 `/news`，顶部出现「专项政策」区块，省份筛选正常工作
7. 社区详情页 metadata description 含政策关键词

---

## 注意事项（来自 CLAUDE.md）

- 无 `src/` 目录，所有文件在项目根目录下
- Prisma 从 `@/lib/db` 导入，Date 传给 Client Component 前 `.toISOString()`
- Admin 页面 `force-dynamic`，公开页面 `revalidate = 3600`
- Server Component 直接查 Prisma，减少 API 中间层
- 社区详情页 `revalidate = 60`（当前值），加政策查询后保持不变
