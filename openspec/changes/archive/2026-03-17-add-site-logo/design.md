## Context

当前 OPC创业圈网站（Next.js 14 App Router）的品牌视觉状态：
- Header 使用纯文字 Logo：`<span>OPC</span><span>创业圈</span>`，位于 `src/app/(main)/layout.tsx`
- 无 favicon——浏览器标签页显示默认空白图标
- `metadata.openGraph` 配置中缺少 `image` 字段，社交分享无预览图
- `public/` 目录仅有百度验证文件，无任何图片资源

已有设计好的 Logo 文件：`~/Desktop/2026-03-17-12-12-00-opcquan-logo-v4.png`

## Goals / Non-Goals

**Goals:**
- 将 Logo 图片集成到 public 目录，建立品牌视觉资源
- Header 展示图片 Logo，桌面端和移动端均可见
- 配置 favicon 提升浏览器标签辨识度
- 配置 og:image 改善社交分享效果

**Non-Goals:**
- 不重新设计 Logo 或创建多尺寸变体（仅使用提供的单一图片）
- 不调整 Header 整体布局或导航结构
- 不实现 SVG Logo 或暗色模式 Logo 变体
- 不修改 admin layout 的 Header

## Decisions

### 1. 使用 Next.js `<Image>` 组件展示 Logo
**选择**: 使用 `next/image` 的 `<Image>` 组件
**理由**: 自动优化图片（WebP 转换、尺寸适配），内置 lazy loading，且与项目技术栈一致
**替代方案**: 原生 `<img>` 标签——更简单但缺少优化

### 2. Logo 尺寸策略
**选择**: 桌面端高度 40px，移动端高度 32px，宽度自适应
**理由**: 匹配现有 Header 高度（h-16 = 64px），留足上下间距
**替代方案**: 固定宽高——可能导致不同比例的 Logo 变形

### 3. Favicon 处理方式
**选择**: 将 logo.png 直接复制为 `public/favicon.png`，通过 Next.js metadata `icons` 配置引用
**理由**: Next.js 原生支持 PNG favicon，无需额外工具转换 ICO 格式；现代浏览器均支持 PNG favicon
**替代方案**: 使用工具转换为 .ico——兼容性略好但增加构建复杂度，收益甚微

### 4. og:image 配置
**选择**: 在根 layout.tsx 的 metadata.openGraph 中添加 `images` 字段，指向 `/logo.png`
**理由**: Next.js metadata API 原生支持，全站自动生效
**替代方案**: 使用 next/og 动态生成——过于复杂，Logo 图片已足够

## Risks / Trade-offs

- **[图片文件缺失]** → 部署前需确认 logo.png 已正确复制到 public/；CI/CD 流程中 public/ 目录会一并部署
- **[Logo 比例未知]** → 使用 `height` 固定 + `width: auto` 策略，适配任意比例的 Logo 图片
- **[移动端空间有限]** → Logo 在移动端缩小至 32px 高度，确保不挤压搜索和用户导航区域
