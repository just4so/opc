# Phase 5: 图片体验优化 Spec

> 目标：①产品详情页支持点击大图（Lightbox）②三处头像上传支持裁剪后上传

---

## 任务一：产品详情页 Lightbox

### 背景
- `components/image-gallery.tsx`（社区详情用）已有完整 Lightbox 实现（点击大图、左右切换、Esc 关闭、body 滚动锁定）
- `components/projects/image-gallery.tsx`（产品详情用）只有轮播，**无 Lightbox**
- 目标：给产品详情页的 ImageGallery 补上 Lightbox，逻辑与社区详情页保持一致

### 实现

**文件：`components/projects/image-gallery.tsx`**

在现有轮播基础上追加：
1. 添加 `activeIndex: number | null` state
2. 每张图片的 `<div>` 加 `onClick={() => open(i)}` 和 `cursor-zoom-in` 样式
3. 在组件末尾加 Lightbox modal（复用 `components/image-gallery.tsx` 里的结构）：
   - 固定全屏遮罩 `fixed inset-0 z-50 bg-black/90`
   - 居中大图 `max-w-[90vw] max-h-[85vh] object-contain`
   - 左右箭头切换（同时同步轮播的 `current` state）
   - 右上角关闭按钮
   - 顶部居中显示 `1 / N` 计数
   - 键盘支持：Esc 关闭、左右箭头切换（useEffect + keydown）
   - 打开时 `document.body.style.overflow = 'hidden'`，关闭时恢复

打开 Lightbox 时同步 `current` state（与轮播保持一致）。

---

## 任务二：头像裁剪上传组件

### 背景
三处头像上传位置：
1. `components/settings/profile-section.tsx` — 用的是 `AvatarPicker`（`components/ui/avatar-picker.tsx`）
2. `app/admin/my-profile/my-profile-client.tsx` — 用的是 `components/admin/image-upload.tsx`
3. `app/admin/managers/managers-client.tsx` — 用的是 `components/admin/image-upload.tsx`

### 依赖
```bash
npm install react-easy-crop
```
（TypeScript 类型已内置，无需额外安装 @types）

### 核心组件：`components/ui/avatar-crop-dialog.tsx`

新建裁剪对话框组件，接口：
```typescript
interface AvatarCropDialogProps {
  open: boolean
  imageUrl: string          // 用户选择的本地图片 objectURL
  onConfirm: (blob: Blob) => void   // 返回裁剪后的 Blob
  onCancel: () => void
}
```

实现：
```tsx
'use client'
import Cropper from 'react-easy-crop'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

// 工具函数：从 canvas 裁剪出指定区域
async function getCroppedImg(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
  const image = await createImageBitmap(await (await fetch(imageSrc)).blob())
  const canvas = document.createElement('canvas')
  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0,
    croppedAreaPixels.width, croppedAreaPixels.height
  )
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9))
}

export function AvatarCropDialog({ open, imageUrl, onConfirm, onCancel }: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    const blob = await getCroppedImg(imageUrl, croppedAreaPixels)
    onConfirm(blob)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-hairline">
          <h3 className="font-semibold text-ink">调整头像</h3>
          <p className="text-xs text-mute mt-0.5">拖动调整位置，双指或滚轮缩放</p>
        </div>
        <div className="relative w-full" style={{ height: 280 }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        {/* 缩放滑块 */}
        <div className="px-4 py-2 flex items-center gap-3">
          <span className="text-xs text-mute">缩小</span>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom} onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-mute">放大</span>
        </div>
        <div className="p-4 flex gap-2 justify-end border-t border-hairline">
          <Button variant="outline" size="sm" onClick={onCancel}>取消</Button>
          <Button size="sm" onClick={handleConfirm}>确认</Button>
        </div>
      </div>
    </div>
  )
}
```

### 改造 AvatarPicker（`components/ui/avatar-picker.tsx`）

在 `handleFileChange` 中，选择文件后**不直接上传**，改为：
1. 用 `URL.createObjectURL(file)` 生成 `localUrl`
2. 打开 `AvatarCropDialog`（`open={true}`, `imageUrl={localUrl}`）
3. 用户点确认 → `onConfirm(blob)` 回调 → 用 blob 构造 `FormData` 上传到 `/api/upload/avatar`
4. 上传成功 → `onSelect(url)` 传出 CDN URL
5. 用户点取消 → 释放 `URL.revokeObjectURL(localUrl)`，不上传

需要添加的 state：
```typescript
const [cropDialogOpen, setCropDialogOpen] = useState(false)
const [localImageUrl, setLocalImageUrl] = useState<string | null>(null)
```

修改后的 `handleFileChange` 流程：
```typescript
// 验证文件类型/大小（不变）
const localUrl = URL.createObjectURL(file)
setLocalImageUrl(localUrl)
setCropDialogOpen(true)
// 不在此处上传
```

新增 `handleCropConfirm`：
```typescript
const handleCropConfirm = async (blob: Blob) => {
  setCropDialogOpen(false)
  setUploading(true)
  const formData = new FormData()
  formData.append('file', blob, 'avatar.jpg')
  // 原有上传逻辑
  ...
  if (localImageUrl) URL.revokeObjectURL(localImageUrl)
  setLocalImageUrl(null)
}
```

在组件 JSX 末尾加：
```tsx
{cropDialogOpen && localImageUrl && (
  <AvatarCropDialog
    open={cropDialogOpen}
    imageUrl={localImageUrl}
    onConfirm={handleCropConfirm}
    onCancel={() => { setCropDialogOpen(false); if (localImageUrl) URL.revokeObjectURL(localImageUrl); setLocalImageUrl(null) }}
  />
)}
```

### 改造 admin ImageUpload（`components/admin/image-upload.tsx`）

仅当 `label` 包含「头像」或「形象照」时启用裁剪逻辑（用 `enableCrop?: boolean` prop 更干净）。

**更好的方案：** 新建 `components/admin/avatar-upload.tsx`，包装现有 ImageUpload + 裁剪逻辑，在需要头像的两处替换使用：

用法示例：
```tsx
// app/admin/my-profile/my-profile-client.tsx 第 105-111 行
// 把 <ImageUpload label="头像" ...> 换成 <AvatarUpload label="头像" ...>
// 接口与 ImageUpload 完全一致，内部多了裁剪步骤
```

两处需要替换：
- `app/admin/my-profile/my-profile-client.tsx`：`<ImageUpload label="头像"` → `<AvatarUpload label="头像"`
- `app/admin/managers/managers-client.tsx`：`<ImageUpload ... label="形象照"` → `<AvatarUpload label="形象照"`

`AvatarUpload` 内部逻辑与 `AvatarPicker` 改造方式相同：选文件 → 打开裁剪框 → 确认后上传。

---

## 执行顺序

1. `npm install react-easy-crop`
2. 新建 `components/ui/avatar-crop-dialog.tsx`
3. 改造 `components/projects/image-gallery.tsx`（加 Lightbox）
4. 改造 `components/ui/avatar-picker.tsx`（接入裁剪）
5. 新建 `components/admin/avatar-upload.tsx`
6. 替换 `admin/my-profile` 和 `admin/managers` 中的头像上传组件
7. `npm run build` 验证

## 验收点
- [ ] 产品详情页点击图片 → 大图弹出，左右切换，Esc 关闭
- [ ] 用户头像上传：选图后弹裁剪框，可拖动/缩放，确认后上传
- [ ] Admin 头像/形象照上传：同上
- [ ] 选择文件后取消裁剪 → 不上传，不报错
- [ ] npm run build 通过
