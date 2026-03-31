## Why

网站目前缺少品牌视觉标识——Header 仅使用纯文字"OPC创业圈"，没有 Logo 图片、favicon，也没有配置 og:image。这导致浏览器标签页无图标、社交分享时无预览图，整体品牌辨识度低。现在已有设计好的 Logo 图片，需要集成到网站各关键位置。

## What Changes

- 将 Logo 图片文件（`~/Desktop/2026-03-17-12-12-00-opcquan-logo-v4.png`）复制到 `public/logo.png`
- 从 logo.png 生成 `public/favicon.png`（或 `favicon.ico`）作为浏览器标签页图标
- 替换 Header 中的纯文字 Logo 为 `<Image>` 组件显示 logo.png，保持点击跳转首页
- 确保移动端 Header 同样显示图片 Logo（适当调整尺寸）
- 在根 layout.tsx 的 metadata 中添加 `og:image` 指向 logo.png

## Capabilities

### New Capabilities
- `site-branding`: 网站品牌资源管理——Logo 图片、favicon、og:image 等品牌视觉元素的集成与展示

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **文件新增**: `public/logo.png`, `public/favicon.png`（或 `.ico`）
- **文件修改**:
  - `src/app/(main)/layout.tsx` — Header 中 Logo 区域从纯文字改为图片
  - `src/app/layout.tsx` — metadata 添加 og:image 和 icons 配置
- **依赖**: 无新增依赖（使用 Next.js 内置 `<Image>` 组件和 metadata API）
- **风险**: 低——仅涉及静态资源和展示层变更，不影响数据模型或 API
