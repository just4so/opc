## ADDED Requirements

### Requirement: Logo 图片资源存放
系统 SHALL 在 `public/` 目录下包含 `logo.png` 文件，作为网站主 Logo 图片资源。
系统 SHALL 在 `public/` 目录下包含 `favicon.png` 文件，作为浏览器标签页图标。

#### Scenario: Logo 文件可访问
- **WHEN** 用户访问 `https://www.opcquan.com/logo.png`
- **THEN** 服务器返回 Logo 图片文件，HTTP 状态码为 200

#### Scenario: Favicon 文件可访问
- **WHEN** 用户访问 `https://www.opcquan.com/favicon.png`
- **THEN** 服务器返回 Favicon 图片文件，HTTP 状态码为 200

### Requirement: Header 展示图片 Logo
网站公共页面（`(main)` 路由组）的 Header SHALL 使用 `<Image>` 组件展示 `logo.png`，替代现有纯文字 Logo。
Logo 图片 SHALL 被包裹在指向首页 (`/`) 的 `<Link>` 组件中，保持点击跳转首页行为。

#### Scenario: 桌面端 Logo 展示
- **WHEN** 用户在桌面端（≥768px）访问任意公共页面
- **THEN** Header 左侧显示 Logo 图片，高度为 40px，宽度自适应

#### Scenario: 移动端 Logo 展示
- **WHEN** 用户在移动端（<768px）访问任意公共页面
- **THEN** Header 左侧显示 Logo 图片，高度为 32px，宽度自适应

#### Scenario: Logo 点击跳转
- **WHEN** 用户点击 Header 中的 Logo 图片
- **THEN** 页面导航到首页 (`/`)

### Requirement: og:image 元数据配置
根 layout 的 metadata SHALL 在 `openGraph.images` 中包含 Logo 图片 URL。
该配置 SHALL 使所有页面的社交分享预览中显示 Logo 图片。

#### Scenario: 社交分享预览
- **WHEN** 用户在社交平台分享网站任意页面链接
- **THEN** 分享预览卡片中显示 Logo 图片

#### Scenario: og:image meta 标签
- **WHEN** 查看任意页面的 HTML 源码
- **THEN** `<head>` 中包含 `<meta property="og:image" content="https://www.opcquan.com/logo.png">`

### Requirement: Favicon 配置
根 layout 的 metadata SHALL 通过 `icons` 配置引用 `favicon.png`，使浏览器标签页显示网站图标。

#### Scenario: 浏览器标签页图标
- **WHEN** 用户在浏览器中打开网站任意页面
- **THEN** 浏览器标签页显示 favicon 图标（非浏览器默认图标）
