# Tasks: community-ux-overhaul

## 背景
opcquan.com 社区系统改造，改善前后台字段语义、展示逻辑和数据质量。

---

## Task 1：数据库 migration — 新增系统设置表 + `contactQrCode` 字段废弃

### 1a. 新增 SiteSetting 模型（prisma/schema.prisma）
```prisma
model SiteSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

### 1b. 执行 migration
```bash
npx prisma migrate dev --name community-ux-overhaul
```

### 1c. 插入初始社群二维码配置（如果表里没有）
```
key: "community_qrcode_url"
value: ""   // 管理员后续上传
```

**验收：** migration 执行成功，SiteSetting 表存在。

---

## Task 2：数据修复脚本 — 三个批量操作

先读文件 `prisma/schema.prisma` 确认字段存在，再执行。

### 2a. 反转 applyDifficulty 值（1→5, 2→4, 3→3, 4→2, 5→1，即 new = 6 - old）
用 Prisma 脚本执行，不用裸 SQL：
```ts
// scripts/fix-difficulty.ts
const communities = await prisma.community.findMany({
  where: { applyDifficulty: { not: null } }
})
for (const c of communities) {
  await prisma.community.update({
    where: { id: c.id },
    data: { applyDifficulty: 6 - c.applyDifficulty! }
  })
}
```

运行：`npx ts-node --project tsconfig.json scripts/fix-difficulty.ts`

### 2b. 批量补全 19 条 newSlug 为空的 ACTIVE 社区
用现有 `slug` 字段直接赋值给 `newSlug`，如有冲突加 `-2` 后缀：
```ts
// scripts/fix-newslug.ts
const communities = await prisma.community.findMany({
  where: { status: 'ACTIVE', newSlug: null }
})
for (const c of communities) {
  let candidate = c.slug
  const exists = await prisma.community.findFirst({
    where: { newSlug: candidate, id: { not: c.id } }
  })
  if (exists) candidate = candidate + '-2'
  await prisma.community.update({
    where: { id: c.id },
    data: { newSlug: candidate }
  })
  console.log(`Fixed: ${c.name} → ${candidate}`)
}
```

运行：`npx ts-node --project tsconfig.json scripts/fix-newslug.ts`

### 2c. 插入 SiteSetting 初始记录（如不存在）
```ts
await prisma.siteSetting.upsert({
  where: { key: 'community_qrcode_url' },
  update: {},
  create: { key: 'community_qrcode_url', value: '' }
})
```

**验收：**
- applyDifficulty 值已反转，没有 null 值被修改
- 19 条 newSlug 为空的社区全部补全，前台可访问

---

## Task 3：后台表单改造（app/admin/communities/community-form.tsx）

### 3a. 移除 `newSlug` 手动输入，改为只读展示
在 C 区（联系与媒体）顶部加一个只读"前台访问地址"：
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">前台访问地址</label>
  <div className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-500">
    <span className="flex-1 font-mono truncate">
      {formData.newSlug
        ? `https://www.opcquan.com/communities/${formData.newSlug}`
        : '保存后自动生成'}
    </span>
    {formData.newSlug && (
      <a href={`https://www.opcquan.com/communities/${formData.newSlug}`}
         target="_blank" rel="noopener noreferrer"
         className="text-primary hover:underline text-xs">预览 ↗</a>
    )}
  </div>
</div>
```
注意：`formData` 里要包含 `newSlug`（initialData 已有此字段），但不加 `<input>` 编辑控件。

### 3b. `contactWechat` 标签改名
- label 改为：`公众号 / 微信号`
- placeholder 改为：`如：公众号名称或微信号`

### 3c. `applyDifficulty` 标签和说明改名
- label 改为：`入驻友好度（1低-5高）`
- StarRating 旁边说明改为：`星级越高代表入驻越容易`

### 3d. 隐藏 `phone` 字段
后台表单中如有独立 `phone` 输入项，删除或注释掉。

**验收：**
- 后台表单"前台访问地址"只读展示正确
- 后台"公众号/微信号"标签已更新
- 后台"入驻友好度"标签和说明已更新

---

## Task 4：后台系统设置页（新建页面）

新建 `app/admin/settings/page.tsx`，提供社群二维码管理：

**功能：**
- 展示当前二维码图片（从 SiteSetting 读取 `community_qrcode_url`）
- 上传新图片（复用现有 `ImageUpload` 组件，上传到 R2）
- 保存更新 `community_qrcode_url`

**API：** 新建 `app/api/admin/settings/route.ts`
- GET：返回所有 SiteSetting
- PATCH：更新指定 key 的 value

把设置页加入后台侧边栏 `app/admin/admin-sidebar.tsx`（Settings 图标）。

**验收：** 后台设置页可访问，可上传二维码图片。

---

## Task 5：前台社区详情页改造（app/(main)/communities/[slug]/page.tsx）

### 5a. 首屏补充 `focus` 展示
在 `suitableFor` 标签区域下方，新增一排 `focus` 标签（紫色）：
```tsx
{community.focus.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-4">
    {community.focus.map((item, index) => (
      <span key={index}
        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md">
        {item}
      </span>
    ))}
  </div>
)}
```

### 5b. `applyDifficulty` 展示方向修正
- 标签文案：`入驻难度` → `入驻友好度`
- `renderStars` 函数保持不变（值已在 Task 2 反转，展示层不需要额外换算）
- 首屏 chip 文案改为"入驻友好度"
- 真实提示区文案改为"入驻友好度"

### 5c. `contactWechat` 前台标签改名
右侧联系栏里 `微信` → `公众号`

### 5d. 右侧联系栏底部新增社群二维码模块
从 SiteSetting 读取 `community_qrcode_url`，如不为空则展示：

新增辅助函数（与 `getCommunity` 同级）：
```ts
async function getQrCodeUrl(): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'community_qrcode_url' }
  })
  return setting?.value ?? ''
}
```

在 `CommunityDetailPage` 中调用，传入展示：
```tsx
{isLoggedIn && qrCodeUrl && (
  <Card className="mt-4">
    <CardContent className="pt-4 text-center">
      <p className="text-sm font-medium text-gray-700 mb-3">加入 OPC 圈，遇见同路人</p>
      <Image src={qrCodeUrl} alt="OPC社群二维码" width={160} height={160}
             className="mx-auto rounded-lg" unoptimized />
    </CardContent>
  </Card>
)}
```

**验收：**
- 前台首屏 `focus` 标签展示（紫色）
- 前台"入驻友好度"文案正确
- 前台右侧联系栏"公众号"标签已更新
- 前台右侧联系栏登录后展示二维码（qrCodeUrl 非空时）

---

## 全局验收标准

- [x] migration 执行成功，SiteSetting 表存在
- [x] 19 条 newSlug 为空的社区全部补全，前台可访问
- [x] applyDifficulty 值已反转，没有 null 值被修改
- [x] 后台表单"前台访问地址"只读展示正确
- [x] 后台"公众号/微信号"标签已更新
- [x] 后台"入驻友好度"标签和说明已更新
- [x] 后台设置页可访问，可上传二维码图片
- [x] 前台首屏 `focus` 标签展示（紫色）
- [x] 前台"入驻友好度"文案正确
- [x] 前台右侧联系栏"公众号"标签已更新
- [x] 前台右侧联系栏登录后展示二维码（qrCodeUrl 非空时）
- [x] `npx tsc --noEmit` 无报错
- [x] `npm run build` 成功
