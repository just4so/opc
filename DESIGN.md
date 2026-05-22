---
version: "1.0"
name: opcquan-design-system
description: |
  OPC圈的设计系统围绕社区信息展示和创业者连接构建。核心设计哲学：安静温暖的中性色底让内容说话，
  OPC Orange（#F97316）作为唯一饱和色承载所有主要行动（CTA、直通车按钮、悬浮按钮），
  Inter + PingFang SC 双语字体栈保证中英文一致的阅读体验。
  
  两种核心页面模式交替出现：信息展示页（社区详情、资讯）使用卡片分区 + 宽松留白，
  功能页（直通车表单、后台看板）使用紧凑的表单/表格布局。
  创业者广场使用 masonry 卡片网格，社区列表使用等高网格。
  
  形状语言：16px 圆角（md）覆盖绝大多数组件，32px（lg）用于大卡片和弹窗，
  pill（9999px）用于搜索栏、筛选标签和状态徽章。不使用直角，不使用阴影（除弹窗遮罩）。

colors:
  # === 品牌色 ===
  primary: "#F97316"           # OPC Orange — 唯一饱和色，CTA、直通车按钮、活跃标签
  on-primary: "#ffffff"
  primary-pressed: "#EA580C"   # 按下态
  primary-soft: "#FFF7ED"      # 极淡橙底——提示卡片、成功提示背景

  # === 文字层级 ===
  ink: "#000000"               # 标题、强调
  ink-soft: "#211922"          # 次级标题
  body: "#33332e"              # 正文
  charcoal: "#262622"          # 深色卡片上的标题
  mute: "#62625b"              # 辅助说明文字
  ash: "#91918c"               # 占位符、禁用态文字
  stone: "#c8c8c1"             # 极弱文字

  # === 表面层级 ===
  canvas: "#ffffff"            # 基底白——导航、弹窗、表单背景
  surface-soft: "#fbfbf9"      # 微暖底色——页面 body wash
  surface-card: "#f6f6f3"      # 卡片背景——社区卡片、创业者卡片、筛选栏
  surface-elevated: "#ffffff"  # 弹窗、浮层
  surface-dark: "#262622"      # 深色区块——footer、深色 CTA 条

  # === 分割线 ===
  hairline: "#dadad3"          # 标准分割线
  hairline-soft: "#e5e5e0"     # 轻分割线

  # === 交互色 ===
  secondary-bg: "#e5e5e0"      # 次要按钮默认
  secondary-pressed: "#c8c8c1"
  on-secondary: "#000000"
  on-dark: "#ffffff"
  on-dark-mute: "rgba(255,255,255,0.7)"

  # === 功能色 ===
  focus-outer: "#435ee5"       # 聚焦环
  focus-inner: "#ffffff"
  success: "#103c25"           # 成功状态文字
  success-bg: "#c7f0da"        # 成功状态背景
  error: "#9e0a0a"             # 错误状态文字
  error-bg: "#FEE2E2"          # 错误状态背景
  warning: "#EA580C"           # 警告（复用 primary-pressed）
  info: "#435ee5"              # 信息提示

  # === 状态徽章色 ===
  badge-pending: "#FEF3C7"     # Inquiry 待跟进
  badge-pending-text: "#92400E"
  badge-contacted: "#DBEAFE"   # 已联系
  badge-contacted-text: "#1E40AF"
  badge-done: "#D1FAE5"        # 已完成
  badge-done-text: "#065F46"
  badge-cancelled: "#F3F4F6"   # 已取消
  badge-cancelled-text: "#6B7280"

typography:
  display-xl:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-lg:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.8px
  heading-xl:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.5px
  heading-lg:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0
  heading-md:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body-lg:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-md:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm-strong:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption-sm:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  button-md:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  button-sm:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: Inter, PingFang SC, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0

rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 32px
  full: 9999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 64px

components:
  # === 按钮 ===
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 44px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ash}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.secondary-bg}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 44px
  button-secondary-pressed:
    backgroundColor: "{colors.secondary-pressed}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
  button-tertiary:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
  button-icon-circular:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 44px

  # === 导航 ===
  primary-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  nav-tab-active:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    borderBottom: "2px solid {colors.primary}"
  nav-tab-inactive:
    backgroundColor: transparent
    textColor: "{colors.mute}"
    typography: "{typography.nav-link}"

  # === 搜索 ===
  search-bar:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 12px 16px
    height: 48px
  search-bar-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    border: "1px solid {colors.hairline}"

  # === 表单 ===
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 14px
    height: 44px
    border: "1px solid {colors.hairline}"
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.primary}"
  text-input-error:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.error}"
  select-dropdown:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 14px
    height: 44px
    border: "1px solid {colors.hairline}"
  form-label:
    textColor: "{colors.body}"
    typography: "{typography.body-sm-strong}"
    marginBottom: "{spacing.xs}"
  form-hint:
    textColor: "{colors.mute}"
    typography: "{typography.caption}"
  form-error:
    textColor: "{colors.error}"
    typography: "{typography.caption}"
  checkbox:
    size: 20px
    rounded: "{rounded.sm}"
    border: "1px solid {colors.hairline}"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"

  # === 社区卡片（列表页） ===
  community-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.hairline-soft}"
  community-card-image:
    rounded: "{rounded.md} {rounded.md} 0 0"
    aspectRatio: "16:10"
  community-card-badge:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-pressed}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  # === 创业者卡片（广场） ===
  creator-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  creator-card-avatar:
    rounded: "{rounded.full}"
    size: 48px
  creator-card-tag:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.mute}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
    border: "1px solid {colors.hairline-soft}"
  verified-badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.full}"
    padding: "2px 8px"

  # === 直通车 ===
  connect-form-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
    maxWidth: 560px
  connect-step-indicator:
    activeColor: "{colors.primary}"
    inactiveColor: "{colors.hairline}"
    size: 8px
    rounded: "{rounded.full}"
  connect-success-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  contact-reveal-block:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  connect-trust-text:
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"

  # === 联系方式模糊化 ===
  contact-blurred:
    textColor: "{colors.ash}"
    typography: "{typography.body-md}"
    filter: "blur(4px)"
  unlock-prompt:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-pressed}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"

  # === 悬浮直通车按钮（手机端） ===
  floating-cta:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: 48px
    shadow: "0 4px 12px rgba(249,115,22,0.3)"
    position: fixed
    bottom: 16px

  # === 筛选 ===
  filter-chip:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"

  # === 状态徽章 ===
  status-badge-pending:
    backgroundColor: "{colors.badge-pending}"
    textColor: "{colors.badge-pending-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-badge-contacted:
    backgroundColor: "{colors.badge-contacted}"
    textColor: "{colors.badge-contacted-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-badge-done:
    backgroundColor: "{colors.badge-done}"
    textColor: "{colors.badge-done-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-badge-cancelled:
    backgroundColor: "{colors.badge-cancelled}"
    textColor: "{colors.badge-cancelled-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  # === 后台表格 ===
  admin-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
  admin-table-header:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.mute}"
    typography: "{typography.body-sm-strong}"
    padding: "12px 16px"
  admin-table-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: "12px 16px"
    borderBottom: "1px solid {colors.hairline-soft}"
  admin-table-row-hover:
    backgroundColor: "{colors.surface-soft}"

  # === 通用卡片 ===
  feature-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.md}"
    padding: "{spacing.xxl}"
  feature-card-soft:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-xl}"
    rounded: "{rounded.md}"
    padding: "{spacing.xxl}"

  # === 弹窗 ===
  modal-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xxl}"
  modal-scrim:
    backgroundColor: "rgba(0,0,0,0.5)"

  # === Footer ===
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
    padding: "{spacing.xxl} {spacing.xl}"
    borderTop: "1px solid {colors.hairline-soft}"
---

## Overview

OPC圈（opcquan.com）的设计系统服务于一个核心目标：**帮助 OPC 创业者找到社区、被行业看见。**

系统围绕三种核心页面模式构建：

1. **信息展示页**（社区详情、资讯详情）— 宽松留白，卡片分区，文字为主。温暖的奶油色底（`{colors.surface-soft}`、`{colors.surface-card}`）让社区信息和政策数据清晰可读。

2. **功能页**（直通车表单、注册/登录）— 居中窄容器（max-width 560px），紧凑的表单布局，每一步只问最少的信息。

3. **发现页**（创业者广场、首页卡片预览）— masonry 网格布局展示创业者卡片，每张卡片是独立的信息单元。

**唯一的色彩事件是 OPC Orange（`{colors.primary}` — `#F97316`）。** 它只出现在主要行动按钮、直通车入口、手机端悬浮 CTA、活跃标签指示器上。其他一切都是中性色——温暖的灰、纯白和奶油色。

**形状语言极简：** 三个圆角值覆盖所有组件——16px（`{rounded.md}`）用于按钮、输入框、卡片；32px（`{rounded.lg}`）用于弹窗和大卡片；pill（`{rounded.full}`）用于搜索栏、筛选标签和徽章。没有直角，没有装饰性阴影。

**字体栈 Inter + PingFang SC** 在中英文混排时保持一致的视觉节奏。display 层级（56px/44px）只用于首页 Hero，页面内标题从 28px（heading-xl）向下递减。正文 16px，辅助信息 14px，标注 12px。

## Colors

### 品牌色
- **OPC Orange**（`{colors.primary}` — `#F97316`）：唯一饱和色。直通车按钮、主 CTA、活跃标签下划线、手机端悬浮按钮。
- **OPC Orange Pressed**（`{colors.primary-pressed}` — `#EA580C`）：按下态，比主色深一阶。
- **OPC Orange Soft**（`{colors.primary-soft}` — `#FFF7ED`）：极淡橙底，用于联系方式解锁提示卡片、成功状态背景。

### 文字
- **Ink**（`{colors.ink}` — `#000000`）：页面标题、强调文本。
- **Body**（`{colors.body}` — `#33332e`）：正文。
- **Mute**（`{colors.mute}` — `#62625b`）：辅助说明、表单提示。
- **Ash**（`{colors.ash}` — `#91918c`）：占位符、禁用态。

### 表面
- **Canvas**（`{colors.canvas}` — `#ffffff`）：导航栏、弹窗、表单区域。
- **Surface Soft**（`{colors.surface-soft}` — `#fbfbf9`）：页面整体底色，微暖。
- **Surface Card**（`{colors.surface-card}` — `#f6f6f3`）：卡片背景——社区卡片、创业者卡片、筛选栏。

### 功能色
- **Success**：`{colors.success}` + `{colors.success-bg}` — 提交成功、Inquiry 完成状态。
- **Error**：`{colors.error}` + `{colors.error-bg}` — 表单校验错误。
- **Status Badges**：四组颜色对应 Inquiry 四种状态（PENDING/CONTACTED/DONE/CANCELLED），在后台看板中使用。

## Typography

默认正文 `{typography.body-md}`（16px/400）；强调用 `{typography.body-strong}`（16px/600）；`{typography.display-xl}`（56px）**严格限制在首页 Hero 使用**。

中英文混排时，Inter 处理英文和数字，PingFang SC 处理中文，`sans-serif` 兜底。行高统一用 1.5 倍（body）和 1.1-1.25 倍（heading），保证中文排版的呼吸感。

## Shape

| Token | 值 | 用途 |
|-------|-----|------|
| `{rounded.sm}` | 8px | 复选框、小元素 |
| `{rounded.md}` | 16px | 按钮、输入框、卡片、表格 |
| `{rounded.lg}` | 32px | 弹窗、大卡片（直通车表单容器） |
| `{rounded.full}` | 9999px | 搜索栏、筛选标签、徽章、头像 |

**没有 0px 圆角**——系统中不存在直角元素（导航栏和 footer 的 `{rounded.none}` 是整屏宽，不视为几何边角）。

## Components

### 直通车相关组件
- **`{component.connect-form-card}`**：直通车表单的外层容器，白底 + 32px 圆角 + 居中 560px 宽。
- **`{component.connect-step-indicator}`**：两步表单的步骤指示器（两个圆点）。
- **`{component.contact-reveal-block}`**：成功页的联系方式展示块，淡橙底 + 完整联系信息。
- **`{component.contact-blurred}`**：社区详情页中模糊化的联系方式（blur 4px + 灰色）。
- **`{component.unlock-prompt}`**：联系方式旁的解锁提示，引导用户走直通车。
- **`{component.floating-cta}`**：手机端底部悬浮的直通车按钮，OPC Orange + pill 形 + 轻橙色阴影。
- **`{component.connect-trust-text}`**：表单中的信任文案（灰色小字）。

### 卡片组件
- **`{component.community-card}`**：社区列表页的卡片，白底 + 封面图 + 信息区。
- **`{component.creator-card}`**：广场中的创业者卡片，奶油色底 + 头像 + 标签。
- **`{component.verified-badge}`**：认证徽章，OPC Orange 底 + 白字。
- **`{component.feature-card}`** / **`{component.feature-card-soft}`**：首页的价值展示卡片。

### 后台组件
- **`{component.admin-table}`**：Inquiry 看板表格。
- **`{component.admin-table-header}`** / **`{component.admin-table-row}`**：表头和行。
- **`{component.status-badge-*}`**：四种 Inquiry 状态的彩色徽章。

### 表单组件
- **`{component.text-input}`** / **`{component.text-input-focused}`** / **`{component.text-input-error}`**：三种状态。
- **`{component.select-dropdown}`**：下拉选择（城市 Combobox 同样使用此基础样式）。
- **`{component.checkbox}`** / **`{component.checkbox-checked}`**：复选框（展示在广场/申请认证）。
- **`{component.form-label}`** / **`{component.form-hint}`** / **`{component.form-error}`**：标签、提示、错误信息。

## Responsive Behavior

### Breakpoints

| 名称 | 宽度 | 关键变化 |
|------|------|---------|
| desktop-large | 1440px+ | 默认布局，广场 4 列卡片网格 |
| desktop | 1280px | 同上，外侧 gutter 收窄 |
| desktop-small | 1024px | 广场 3 列；子导航保持水平 |
| tablet | 768px | 广场 2 列；导航收起为汉堡菜单；搜索栏收为图标 |
| mobile | 480px | 广场单列；Hero 标题 56px → 36px；直通车表单全宽 |
| mobile-narrow | 320px | 标题进一步缩小至 28px；section padding 收至 32px |

### 触控目标
所有可交互元素 ≥ 44×44px（WCAG AA）。`{component.button-primary}` 44px 高。`{component.text-input}` 44px 高。`{component.search-bar}` 48px。`{component.floating-cta}` 48px。`{component.filter-chip}` 36-40px 高 + padding 扩展到 44px。

### 折叠策略
- **导航栏：** 桌面水平 → 768px 以下汉堡菜单。OPC Orange CTA 始终可见。
- **搜索栏：** 桌面居中 → 768px 以下收为放大镜图标 → 点击展开全宽。
- **创业者广场网格：** 4列 → 3列 → 2列 → 1列（1440/1024/768/480px）。gutter 桌面 8px → 手机 6px。
- **社区列表：** 桌面地图+列表双栏 → 768px 以下默认列表，地图为切换按钮。
- **社区详情页：** 桌面侧边栏（政策）+ 主栏 → 768px 以下单栏堆叠。手机端底部悬浮直通车按钮。
- **直通车表单：** 桌面居中 560px → 手机全宽 padding 16px。
- **首页 Hero：** `{typography.display-xl}` 56px 桌面 → 44px → 36px → 28px。
- **首页价值卡片：** 桌面三列 → 手机纵向堆叠。
- **弹窗：** 桌面居中 480px 卡片 → 手机全宽底部 sheet（顶部 32px 圆角）。
- **Footer：** 桌面 4 列链接 → 手机手风琴折叠。
- **Section padding：** `{spacing.section}` 64px 桌面 → 48px tablet → 32px mobile。

## 设计原则

1. **OPC Orange 稀缺使用** — 每个可视区域最多一个橙色 CTA（算上导航、Hero、卡片内的 CTA）。
2. **内容优先** — 社区信息、政策数据、创业者信息是核心，设计不与内容竞争。
3. **表单极简** — 直通车每步最少字段，标签在上方，一屏内完成。
4. **三圆角系统** — 16px/32px/pill 覆盖一切，不引入新圆角值。
5. **无装饰阴影** — 除弹窗遮罩（`{component.modal-scrim}`）和悬浮 CTA 外，不使用 box-shadow。
6. **新增组件前先问** — 能否用现有的 card + 16px 圆角 + 奶油色表面表达？能则不加新 token。

## Iteration Guide

1. 每次只改一个组件，用 YAML token 名称引用。
2. 正文默认 `{typography.body-md}`，强调用 `{typography.body-strong}`，`{typography.display-xl}` 只用于首页 Hero。
3. 新增组件变体（-pressed, -focused, -error）作为独立条目，不要写在描述里。
4. 保持 `{colors.primary}` 稀缺——每屏最多一个橙色 CTA。
5. 编辑后运行 `npx @google/design.md lint DESIGN.md` 检查。

## Known Gaps

- **暗色模式** 未定义——当前只有亮色方案。
- **动画/过渡** 未定义——按钮 hover、卡片加载动画等需要后续补充。
- **图标系统** 未指定——建议使用 Lucide Icons（与 shadcn/ui 一致）。
- **表单校验动画** 未定义——只定义了静态 error 状态。
- **移动端手势** 未定义——列表下拉刷新、卡片滑动等交互需后续补充。
