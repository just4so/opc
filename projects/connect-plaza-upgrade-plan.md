# OPC直通车&广场优化 - 完整任务规划

> 创建时间：2026-05-25
> 状态：待执行，等待阿良哥确认后派 ACP
> 项目路径：/Users/wei/Documents/opc

---

## 批次1：Schema 变更（必须先跑，其他改动依赖它）

### 任务说明
Inquiry 表新增 `acceptInterview` 字段。

### 具体改动

**文件：`prisma/schema.prisma`**

在 `model Inquiry` 中，`wantVerify Boolean @default(false)` 下方加一行：
```prisma
acceptInterview Boolean @default(false)
```

**执行命令：**
```bash
npm run db:push
# 或者
npx prisma db push
```

### 验收标准
- schema 文件改动正确
- `npm run db:push` 无报错
- `npm run build` 通过

---

## 批次2：全部代码改动

> 依赖批次1完成后再执行

### 任务 2-A：产品描述字段激活（8个文件）

---

#### 2-A1 直通车表单产品描述
**文件：** `components/connect/connect-form.tsx`

找到 `productTagline` 相关的 Label 和 Input，做以下修改：

```
Label 文字：
「一句话介绍产品（选填）」→「简单描述你的产品或服务（选填）」

Input placeholder：
「例：帮助创业者快速搭建落地页」→「你在做什么，解决谁的问题，现在到了哪个阶段」

Input maxLength：
100 → 300
```

---

#### 2-A2 直通车 API 修复 description 为空
**文件：** `app/api/inquiries/route.ts`

找到创建 Project 的代码块，修改：
```typescript
// 改前
description: '',

// 改后
description: productTagline || '',
```

---

#### 2-A3 设置页加 description 输入框
**文件：** `app/(main)/settings/page.tsx`

1. `newProject` state 加字段：
```typescript
// 改前
{ name: '', tagline: '', stage: 'IDEA', website: '', contentType: 'PROJECT' }

// 改后
{ name: '', tagline: '', description: '', stage: 'IDEA', website: '', contentType: 'PROJECT' }
```

2. 在 tagline Input 下方、stage select 上方，加 Textarea：
```tsx
<Textarea
  value={newProject.description}
  onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
  placeholder="你在做什么，解决谁的问题，现在到了哪个阶段"
  maxLength={500}
  rows={3}
  className="resize-none"
/>
```

---

#### 2-A4 设置页 API 接收 description
**文件：** `app/api/user/projects/route.ts`

1. 解构时加 description：
```typescript
// 改前
const { name, tagline, stage, website, contentType } = body

// 改后
const { name, tagline, description, stage, website, contentType } = body
```

2. 校验：
```typescript
// 改前
if (!name?.trim() || !tagline?.trim()) {

// 改后
if (!name?.trim() || !tagline?.trim()) {
// 同时加 description 长度校验
if (description && description.length > 500) {
  return NextResponse.json({ error: '描述不能超过500字' }, { status: 400 })
}
```

3. 创建时：
```typescript
// 改前
description: tagline.trim(),

// 改后
description: description?.trim() || tagline.trim(),
```

4. select 加 description 返回：
```typescript
select: {
  id: true,
  name: true,
  tagline: true,
  description: true,   // 新增
  stage: true,
  website: true,
  contentType: true,
}
```

---

#### 2-A5 广场产品卡片加 description 展示+折叠
**文件：** `components/plaza/plaza-client.tsx`

1. `PlazaProject` interface 加字段：
```typescript
// 在 tagline: string 下方加
description: string | null
```

2. 卡片内 tagline 段落下方加折叠展示逻辑：
```tsx
// 在 <p className="text-sm text-body leading-relaxed">{proj.tagline}</p> 下方加

{proj.description && proj.description !== proj.tagline && (
  <DescriptionCollapse description={proj.description} />
)}
```

3. 在文件顶部（组件外）加 DescriptionCollapse 子组件：
```tsx
function DescriptionCollapse({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = description.length > 80

  return (
    <div className="mt-1.5">
      <p className={`text-xs text-mute leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {description}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-ash hover:text-mute mt-0.5 cursor-pointer"
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </div>
  )
}
```

注意：底部操作区已有 `mt-auto`，有/无 description 的卡片对齐不受影响。

---

#### 2-A6 广场产品 API 加 description
**文件：** `app/api/plaza/projects/route.ts`

在 select 里加：
```typescript
description: true,   // 加在 tagline: true 下方
```

---

#### 2-A7 广场初始页 SSR 加 description
**文件：** `app/(main)/plaza/page.tsx`

找到 initialProjects 的 select，加：
```typescript
description: true,   // 加在 tagline: true 下方
```

---

#### 2-A8 个人主页产品列表加 description
**文件：** `components/profile/profile-client.tsx`

1. 产品相关 interface 加字段：
```typescript
description: string | null   // 加在 tagline: string 下方
```

2. tagline 段落下方加（不折叠，完整展示）：
```tsx
{proj.description && proj.description !== proj.tagline && (
  <p className="text-xs mt-1" style={{ color: '#91918c' }}>{proj.description}</p>
)}
```

3. 个人主页对应 API/SSR select 也需要加 `description: true`（检查 profile page.tsx 的 Prisma query）

---

### 任务 2-B：直通车 Bug & 功能

---

#### 2-B1 微信号改为手机号
**文件：** `components/connect/connect-form.tsx`

```
Label：「微信号（用于社区对接） *」→「手机号（用于社区对接） *」
placeholder：「你的微信号」→「你的手机号」
```

---

#### 2-B2 城市列表改为动态读取
**文件：** `app/(main)/connect/page.tsx`

1. 删除 `import { CITIES } from '@/constants/cities'`
2. 改为从数据库读取城市列表：
```typescript
// 删除
const cityNames = CITIES.map((c) => c.name)

// 改为
const cityGroups = await prisma.community.groupBy({
  by: ['city'],
  where: { status: 'ACTIVE', city: { not: null } },
  _count: { city: true },
  orderBy: { _count: { city: 'desc' } },
})
const cityNames = cityGroups
  .map((c) => c.city)
  .filter((c): c is string => !!c)
```

---

#### 2-B3 城市选择加首字母导航
**文件：** `components/connect/connect-form.tsx`

将城市下拉 Select 改为带首字母分组的选择器：

实现思路：
- 引入拼音映射工具（可用简单的汉字首字母映射对象，覆盖所有已知城市）
- 将城市列表按首字母分组：A/B/C/D.../Z
- Select 内用 `SelectGroup` + `SelectLabel` 展示分组
- 分组标题显示字母，组内显示该字母开头的城市

城市拼音首字母对照（主要城市，需在组件内定义）：
```typescript
const CITY_PINYIN_INITIAL: Record<string, string> = {
  '安庆': 'A', '鞍山': 'A',
  '北京': 'B', '保定': 'B', '宝鸡': 'B',
  '成都': 'C', '常州': 'C', '长沙': 'C', '长春': 'C', '重庆': 'C',
  '大连': 'D', '大同': 'D', '东莞': 'D',
  '佛山': 'F', '福州': 'F',
  '广州': 'G', '贵阳': 'G', '桂林': 'G',
  '哈尔滨': 'H', '哈密': 'H', '海口': 'H', '合肥': 'H', '杭州': 'H', '呼和浩特': 'H', '湖州': 'H', '惠州': 'H',
  '济南': 'J', '嘉兴': 'J', '金华': 'J',
  '昆明': 'K', '昆山': 'K',
  '兰州': 'L', '连云港': 'L', '柳州': 'L',
  '马鞍山': 'M',
  '南京': 'N', '南宁': 'N', '南通': 'N', '南昌': 'N', '宁波': 'N',
  '青岛': 'Q', '泉州': 'Q',
  '沈阳': 'S', '深圳': 'S', '石家庄': 'S', '苏州': 'S', '宿迁': 'S', '绍兴': 'S',
  '太原': 'T', '天津': 'T',
  '温州': 'W', '武汉': 'W', '无锡': 'W', '芜湖': 'W',
  '厦门': 'X', '西安': 'X', '徐州': 'X', '襄阳': 'X',
  '扬州': 'Y', '烟台': 'Y', '义乌': 'Y', '玉林': 'Y',
  '郑州': 'Z', '中山': 'Z', '珠海': 'Z', '漳州': 'Z',
  '常熟': 'C', '海宁': 'H',
}
```

---

#### 2-B4 第二页加采访意向 checkbox
**文件：** `components/connect/connect-form.tsx`

1. schema 加字段（已在批次1完成）
2. form2 的 schema 加：
```typescript
acceptInterview: z.boolean().optional().default(false),
```
3. form2 默认值加：
```typescript
acceptInterview: false,
```
4. 在第二页产品信息区块下方、提交按钮上方，加 checkbox：
```tsx
<div className="flex items-start gap-3">
  <Checkbox
    id="acceptInterview"
    checked={form2.watch('acceptInterview')}
    onCheckedChange={(val) => form2.setValue('acceptInterview', !!val)}
  />
  <div>
    <Label htmlFor="acceptInterview" className="cursor-pointer">
      愿意接受官方媒体采访或宣传报道
    </Label>
    <p className="text-xs text-mute mt-0.5">
      OPC圈会不定期推荐优质创业者故事，勾选后有机会获得曝光
    </p>
  </div>
</div>
```
5. 提交时传递：
```typescript
acceptInterview: step2Data?.acceptInterview || false,
```

---

#### 2-B5 直通车 API 接收 acceptInterview
**文件：** `app/api/inquiries/route.ts`

1. schema 加字段：
```typescript
acceptInterview: z.boolean().optional().default(false),
```
2. 解构时加：
```typescript
const { ..., acceptInterview } = parsed.data
```
3. 创建 inquiry 时加：
```typescript
data: {
  ...
  acceptInterview: acceptInterview ?? false,
}
```

---

### 任务 2-C：后台 Bug 修复

---

#### 2-C1 后台展示 BP 文件
**文件：** `app/admin/inquiries/inquiries-client.tsx`

1. interface 确认有 `bpUrl` 和 `bpFilename` 字段（API 已返回，只是没渲染）
2. 表头加一列：`<th className="pb-3 pr-4 font-medium">BP</th>`
3. 行内加对应列：
```tsx
<td className="py-3 pr-4">
  {inq.bpUrl ? (
    <a
      href={inq.bpUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-primary hover:underline flex items-center gap-1"
    >
      <FileText className="h-3 w-3" />
      {inq.bpFilename || '查看BP'}
    </a>
  ) : (
    <span className="text-gray-300">-</span>
  )}
</td>
```

---

#### 2-C2 后台时间改为北京时间
**文件：** `app/admin/inquiries/inquiries-client.tsx`

```typescript
// 改前
function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 改后
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
```

---

#### 2-C3 导出 CSV 时间改为北京时间
**文件：** `app/api/admin/export/inquiries/route.ts`

```typescript
// 改前
const date = new Date(inq.createdAt)
const dateStr = `${date.getFullYear()}-${...}`

// 改后
const dateStr = new Date(inq.createdAt).toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
```

---

#### 2-C4 导出 CSV 加 BP 和采访意向列
**文件：** `app/api/admin/export/inquiries/route.ts`

```typescript
// 改前
const header = '称呼,联系方式,意向社区,城市,方向,阶段,状态,提交时间'

// 改后
const header = '称呼,联系方式,意向社区,城市,方向,阶段,状态,提交时间,BP文件,愿意接受采访'

// 行数据加两列
inq.bpFilename || '',
inq.acceptInterview ? '是' : '否',
```

---

#### 2-C5 后台展示采访意向列
**文件：** `app/admin/inquiries/inquiries-client.tsx`

1. 表头加：`<th className="pb-3 pr-4 font-medium">采访意向</th>`
2. 行内加：
```tsx
<td className="py-3 pr-4 text-gray-600">
  {inq.acceptInterview ? (
    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">愿意</span>
  ) : (
    <span className="text-gray-300 text-xs">-</span>
  )}
</td>
```

---

## 执行顺序

```
批次1（先）：schema 变更
    ↓
批次2（后）：所有代码改动（A/B/C 可以一次性做完）
    ↓
本地验证：npm run build 通过
    ↓
commit + push
```

## 验收标准

- [ ] `npm run build` 无报错
- [ ] 直通车表单：联系方式显示「手机号」
- [ ] 直通车表单：城市列表包含重庆、长沙、西安等城市
- [ ] 直通车表单：城市按首字母分组
- [ ] 直通车表单：第二页有「愿意接受采访」checkbox
- [ ] 直通车表单：产品描述 placeholder 正确
- [ ] 设置页：添加产品有描述文本框
- [ ] 广场产品卡片：有 description 时显示，超长可展开/收起
- [ ] 个人主页：产品列表展示 description
- [ ] 后台意向列表：有 BP 列、采访意向列、时间显示北京时间
- [ ] 导出 CSV：包含 BP、采访意向列，时间为北京时间
