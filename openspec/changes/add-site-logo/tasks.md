## 1. 静态资源准备

- [x] 1.1 将 `~/Desktop/2026-03-17-12-12-00-opcquan-logo-v4.png` 复制到 `public/logo.png`
- [x] 1.2 将 `public/logo.png` 复制为 `public/favicon.png` 作为浏览器标签页图标

## 2. Header Logo 替换

- [x] 2.1 在 `src/app/(main)/layout.tsx` 中引入 `next/image` 的 `Image` 组件
- [x] 2.2 将 Header 中的纯文字 Logo（`<span>OPC</span><span>创业圈</span>`）替换为 `<Image src="/logo.png">` 组件，桌面端高度 40px、移动端高度 32px，宽度自适应
- [x] 2.3 确保 `<Image>` 包裹在现有的 `<Link href="/">` 中，保持点击跳转首页行为

## 3. Metadata 配置

- [x] 3.1 在 `src/app/layout.tsx` 的 `metadata.openGraph` 中添加 `images` 字段，值为 `https://www.opcquan.com/logo.png`
- [x] 3.2 在 `src/app/layout.tsx` 的 `metadata` 中添加 `icons` 配置，引用 `/favicon.png`

## 4. 验证

- [x] 4.1 运行 `npm run build` 确认构建无报错
- [x] 4.2 本地启动 `npm run dev`，检查桌面端和移动端 Header Logo 显示正常
- [x] 4.3 检查页面 HTML 源码中包含正确的 `og:image` 和 favicon meta 标签
