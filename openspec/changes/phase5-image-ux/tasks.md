# Phase 5: 图片体验优化

## 概述

给产品详情页图片补全 Lightbox（点击大图、左右切换、键盘支持），并为三处头像上传添加裁剪对话框（选图 → 裁剪预览 → 确认后上传）。社区详情页已有完整 Lightbox 实现，产品详情页复用相同逻辑。头像裁剪依赖 `react-easy-crop`，通过独立组件封装，不影响现有上传 API。

## 依赖安装

```bash
npm install react-easy-crop
```

（TypeScript 类型已内置，无需 @types）

---

## Task 列表

### Task 1: 新建头像裁剪对话框组件

**文件**: `components/ui/avatar-crop-dialog.tsx`（新建）

**改动**:
- 新建 `AvatarCropDialog` 组件，接受 `open / imageUrl / onConfirm / onCancel` 四个 props
- 使用 `react-easy-crop` 的 `Cropper`，`aspect=1`，`cropShape="round"`，`showGrid=false`
- 添加缩放滑块（`input[type=range]` min=1 max=3 step=0.05）
- 工具函数 `getCroppedImg(imageSrc, croppedAreaPixels)` 用 canvas 裁剪并返回 `Blob`（JPEG 0.9 质量）
- 确认按钮调用 `handleConfirm` → `getCroppedImg` → `onConfirm(blob)`
- 取消按钮调用 `onCancel`
- 样式遵循项目规范：`rounded-2xl`、`bg-white`、`border-hairline`、`text-ink/text-mute`，不使用 hex 硬编码

**验收**:
- [ ] 组件可导入，无 TS 编译错误
- [ ] 传入任意图片 URL 可渲染裁剪框
- [ ] 滑块可调节缩放，圆形裁剪区域实时更新
- [ ] 点击「确认」触发 `onConfirm(blob)`，blob 为 JPEG 格式
- [ ] 点击「取消」触发 `onCancel`，不产生 blob

---

### Task 2: 产品详情页 ImageGallery 加 Lightbox

**文件**: `components/projects/image-gallery.tsx`

**改动**:
- 添加 `activeIndex: number | null` state（`null` 表示 Lightbox 关闭）
- 每张缩略图 `<div>` 加 `onClick={() => setActiveIndex(i)}` 和 `cursor-zoom-in` class
- 组件末尾追加 Lightbox modal（`activeIndex !== null` 时渲染）：
  - 全屏遮罩：`fixed inset-0 z-50 bg-black/90 flex items-center justify-center`
  - 大图：`max-w-[90vw] max-h-[85vh] object-contain`
  - 左右箭头按钮切换（同步更新 `activeIndex` 和轮播的 `current` state）
  - 右上角关闭按钮（`X` 图标，lucide-react `X`）
  - 顶部居中显示 `{activeIndex + 1} / {images.length}`
- `useEffect` 监听 `keydown`：Esc → 关闭，ArrowLeft/ArrowRight → 切换
- 打开时 `document.body.style.overflow = 'hidden'`，关闭时恢复（cleanup 也要恢复）

**参考**: 复用 `components/image-gallery.tsx`（社区详情页版本）中已有的 Lightbox 结构

**验收**:
- [ ] 点击产品详情页任意图片 → 全屏大图弹出
- [ ] 左右箭头可切换，同时底部轮播同步
- [ ] 键盘 Esc 关闭，← / → 切换
- [ ] 打开时页面不可滚动，关闭后恢复
- [ ] 图片右上角显示 `N / Total` 计数

---

### Task 3: AvatarPicker 接入裁剪

**文件**: `components/ui/avatar-picker.tsx`

**改动**:
- 添加 state：`cropDialogOpen: boolean`，`localImageUrl: string | null`
- 修改 `handleFileChange`：文件类型/大小验证通过后，调用 `URL.createObjectURL(file)` 生成 `localUrl`，设置 `setLocalImageUrl(localUrl)` + `setCropDialogOpen(true)`，**不直接上传**
- 新增 `handleCropConfirm(blob: Blob)`：关闭裁剪框 → `setUploading(true)` → 用 blob 构造 `FormData`（`formData.append('file', blob, 'avatar.jpg')`）→ 调用原有上传逻辑 → 成功后 `URL.revokeObjectURL(localImageUrl)` + `setLocalImageUrl(null)`
- 新增 `handleCropCancel`：`setCropDialogOpen(false)` + `URL.revokeObjectURL(localImageUrl)` + `setLocalImageUrl(null)`
- JSX 末尾添加：
  ```tsx
  {cropDialogOpen && localImageUrl && (
    <AvatarCropDialog
      open={cropDialogOpen}
      imageUrl={localImageUrl}
      onConfirm={handleCropConfirm}
      onCancel={handleCropCancel}
    />
  )}
  ```

**验收**:
- [ ] 设置页头像区块：选择图片文件 → 弹出裁剪框（非直接上传）
- [ ] 调整后点击「确认」→ 上传成功，头像更新
- [ ] 点击「取消」→ 不上传，不报错，上传按钮恢复正常状态
- [ ] 不合规文件（超大/非图片）仍显示原有错误提示，不打开裁剪框

---

### Task 4: 新建 Admin 头像上传组件

**文件**: `components/admin/avatar-upload.tsx`（新建）

**改动**:
- 新建 `AvatarUpload` 组件，接口与现有 `ImageUpload` 完全一致（props 签名相同，可直接替换）
- 内部封装：选文件 → 打开 `AvatarCropDialog` → 确认后用 blob 执行原有上传逻辑
- 添加 state：`cropDialogOpen / localImageUrl`（同 Task 3 的模式）
- 上传目标 API 与 `ImageUpload` 保持一致（沿用 `onUpload` prop 或组件内部上传路径，与现有 admin ImageUpload 行为一致）

**验收**:
- [ ] 组件可独立导入，无 TS 错误
- [ ] 选文件后打开裁剪框而非直接上传
- [ ] 确认裁剪后上传，上传结果与原 ImageUpload 行为一致
- [ ] 取消裁剪不触发上传

---

### Task 5: Admin 页面替换头像上传组件

**文件**:
- `app/admin/my-profile/my-profile-client.tsx`
- `app/admin/managers/managers-client.tsx`

**改动**:
- `my-profile-client.tsx`：将 `<ImageUpload label="头像" ...>` 替换为 `<AvatarUpload label="头像" ...>`，添加对应 import
- `managers-client.tsx`：将 `<ImageUpload ... label="形象照" ...>` 替换为 `<AvatarUpload label="形象照" ...>`，添加对应 import
- 删除两个文件中不再需要的 `ImageUpload` import（如果该文件中只有头像处使用 ImageUpload）

**验收**:
- [ ] Admin「我的资料」页：上传头像时弹出裁剪框
- [ ] Admin「管理员」页：上传形象照时弹出裁剪框
- [ ] 两处均可正常裁剪 → 确认 → 上传成功
- [ ] `npm run build` 通过，无 TS 错误
- [ ] 非头像的其他 ImageUpload 使用处不受影响

---

## 全局验收

- [ ] 产品详情页 Lightbox 完整可用（大图/切换/键盘/滚动锁）
- [ ] 三处头像上传均有裁剪步骤（Settings 设置页 / Admin 我的资料 / Admin 管理员）
- [ ] 取消裁剪场景：不上传、不报错、UI 恢复正常
- [ ] `npm run build` 通过，无 TS 类型错误
- [ ] 样式符合项目规范（不含 hex 硬编码、不用 rounded-xl/md/lg、不用 arbitrary 间距）
