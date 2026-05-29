# Phase 3 T2: 产品图片上传（R2 存储 + 上传组件）

## 背景

Product 模型已有 `images String[]` 字段（T1 完成）。需要：
1. 产品图片上传 API（复用 lib/r2.ts 的 uploadBuffer）
2. 通用多图上传组件（最多 5 张，第一张为封面）
3. 在"我的产品"编辑和直通车 Step 2 中接入

## 参考

- 已有上传 API 模式：`app/api/upload/post-image/route.ts`（formData + uploadBuffer）
- R2 工具：`lib/r2.ts`（getPresignedUploadUrl, uploadBuffer）
- 设计约束：DESIGN.md tokens only，rounded-2xl cards，#F97316 primary

---

## Task 1: 产品图片上传 API

创建 `app/api/upload/product-image/route.ts`：
- 认证：必须登录
- 接收 formData，字段名 `file`
- 允许类型：jpg/png/webp/gif
- 大小限制：5MB（产品图比帖子图严格些）
- R2 key 格式：`product-images/{userId}/{timestamp}.{ext}`
- 返回 `{ url: publicUrl }`
- 复用 `@/lib/r2` 的 `uploadBuffer`

## Task 2: 多图上传组件

创建 `components/ui/image-upload.tsx`：

Props:
```ts
interface ImageUploadProps {
  value: string[]           // 当前图片 URL 数组
  onChange: (urls: string[]) => void
  maxImages?: number        // 默认 5
  uploadEndpoint?: string   // 默认 '/api/upload/product-image'
  disabled?: boolean
}
```

功能：
- 网格展示已上传图片（第一张左上角显示"封面"标签）
- 点击"+"添加图片（触发 input[type=file]）
- 每张图右上角有删除按钮（×）
- 上传中显示 loading spinner + 进度条（或 skeleton）
- 达到 maxImages 时隐藏"+"按钮
- 拖拽排序 **不做**（v1 按上传顺序）
- 图片预览：点击放大（可选，不强制）

样式：
- 网格：`grid grid-cols-3 gap-3`（移动端 `grid-cols-2`）
- 图片容器：`aspect-square rounded-xl overflow-hidden border border-hairline`
- "+"按钮：虚线边框，居中 + 图标
- 封面标签：左上角小 badge，bg-primary text-white text-xs px-2 py-0.5 rounded

## Task 3: 产品编辑页接入

在 `app/(main)/settings/page.tsx` 的产品编辑模块中：
- 找到产品编辑表单（或创建产品的 Dialog）
- 加入 ImageUpload 组件，绑定 `images` 字段
- 提交时将 images URL 数组一起保存

注意：如果当前 settings 页面没有独立的产品编辑表单，先确认产品编辑入口在哪里（可能在 project-detail 页面或单独的编辑页），在正确位置接入。

## Task 4: 产品 API 支持 images 字段读写

确认以下 API 在创建/更新产品时接受 `images: string[]`：
- `app/api/user/projects/route.ts`（如果有 PUT/PATCH）
- `app/api/inquiries/route.ts`（直通车创建产品时）
- 产品详情查询时返回 images 字段

如果 API 已经通过 Prisma 自动包含 images（因为 schema 有这个字段），只需确认 select/include 没有排除它。

## 验收标准

- [ ] `npm run build` 通过
- [ ] 上传 API 返回正确的 R2 公开 URL
- [ ] ImageUpload 组件支持添加、删除、显示封面标签
- [ ] 产品编辑能保存 images 数组到数据库
