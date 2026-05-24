# V2 视觉升级 — 交互动效规范

> 基于 Stripe / Vercel / Linear 交互研究，结合 OPC圈 技术栈（Next.js 14 + TailwindCSS）
> 原则：**CSS 优先**，不引入重依赖（不用 framer-motion/GSAP），用 Intersection Observer + CSS transition 覆盖 95% 场景

---

## 一、全局交互

### 1.1 导航栏
- **毛玻璃效果**：`backdrop-filter: blur(12px)` + 半透明白底 `rgba(255,255,255,0.8)`
- **滚动变化**：滚动超过 50px 后，底线从透明变为 `hairline-soft`（CSS 变量 + scroll 监听）
- **当前页高亮**：当前路由对应的导航项颜色 `ink`，其余 `mute`

### 1.2 滚动揭示（Scroll Reveal）
**全站统一动画：元素进入视口时淡入上移**
```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```
- 用 Intersection Observer 在元素进入视口 20% 时添加 `.visible`
- **交错延迟**：同一组的多个元素依次出现（grid 内的卡片用 `transition-delay: 0.1s * index`）
- **只触发一次**：进入后不再监听（`{ once: true }`）
- **无障碍**：`@media (prefers-reduced-motion: reduce)` 下禁用动画

### 1.3 页面切换
- Next.js App Router 内置 loading 状态
- 顶部加细进度条（NProgress 样式，纯 CSS，橙色）

---

## 二、首页专项

### 2.1 Hero 区
- **渐变光晕**：纯 CSS `radial-gradient` + `filter: blur(40px)`，静态不动画（动画光晕会分散注意力）
- **网格底纹**：CSS `linear-gradient` 生成，用 `mask-image: radial-gradient(...)` 做中心渐隐
- **标题渐变文字**：`background: linear-gradient(...)` + `background-clip: text`
- **CTA 按钮悬停**：
  - 主按钮：`translateY(-1px)` + 加深阴影
  - 次按钮：背景从透明变为 `surface-soft`

### 2.2 价值卡片
- **1px 分隔的三联卡片**：`gap: 1px` + 外层 `background: hairline-soft`（缝隙颜色）
- **悬停**：背景从 `canvas` 变为 `surface-soft`（`transition: 0.3s`）
- **数字**：渐变色大字，纯 CSS

### 2.3 深色数据区
- **网格底纹**：和 Hero 一样的技术，但用白色低透明度线
- **中心光晕**：橙色 `radial-gradient`，`opacity: 0.08`，`filter: blur(60px)`
- **滚动揭示**：数字从 0 递增到目标值（countUp 效果，纯 JS，200ms/数字）
- **Tagline**：在数字动画完成 0.3s 后淡入

---

## 三、卡片交互（全站通用）

### 3.1 社区卡片 / 创业者卡片 / 产品卡片
- **默认**：白底 + 1px `hairline-soft` 描边
- **悬停三段式**：
  1. `border-color: transparent`（边框消失）
  2. `box-shadow: 0 8px 24px rgba(0,0,0,0.06)`（浮起）
  3. `transform: translateY(-2px)`（微上移）
  4. `transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **点击态**：`transform: translateY(0)` + shadow 缩小（按下反馈）

### 3.2 按钮
- **主按钮（橙色）**：
  - hover: `translateY(-1px)` + 阴影从 `4px 16px` 到 `6px 24px`
  - active: `translateY(0)` + 阴影回缩
  - 全局 transition: `0.2s ease`
- **次按钮（描边）**：
  - hover: 背景 `surface-soft`，边框 `stone`
- **幽灵按钮（纯文字）**：
  - hover: 颜色 `primary`

### 3.3 链接
- "了解更多 →" / "查看全部 →"：
  - hover 时箭头 `translateX(4px)`
  - 颜色从 `mute` 变为 `primary`
  - `transition: all 0.2s`

---

## 四、表单交互（直通车/设置页）

### 4.1 Input 聚焦
- 默认：`border: 1.5px solid hairline-soft`
- 聚焦：`border-color: primary` + `box-shadow: 0 0 0 3px rgba(249,115,22,0.1)`（橙色光圈）
- 错误：`border-color: error` + `box-shadow: 0 0 0 3px rgba(158,10,10,0.1)`

### 4.2 步骤切换（直通车两步表单）
- 步骤指示器：当前步骤圆点 `primary` 填充 + 缩放 `scale(1.1)`
- 内容区：淡入（`opacity 0→1` + `translateX(20px→0)`），持续 0.3s

### 4.3 提交按钮
- loading 态：文字隐藏 + spinner 旋转
- 成功态：按钮变绿 `ds-success` + checkmark 动画

---

## 五、列表/筛选交互

### 5.1 Tab 切换（广场三视图）
- 下划线从当前 Tab 滑到目标 Tab（`transition: left 0.3s, width 0.3s`）
- 内容区域淡入（不用滑动，避免不同内容高度跳动）

### 5.2 省份折叠（社区列表）
- 展开/折叠用 `max-height` + `overflow: hidden` + `transition: 0.3s`
- 箭头图标旋转 `rotate(180deg)`

### 5.3 筛选标签
- 选中态：背景 `primary-soft` + 文字 `primary` + 边框 `primary`
- 未选中：背景 `canvas` + 边框 `hairline-soft`
- 切换时 `transition: 0.2s`

---

## 六、通知/Toast

### 6.1 通知下拉面板
- 打开：`opacity 0→1` + `translateY(-8px→0)` + `scale(0.95→1)`
- 关闭：反向，`0.15s`

### 6.2 Toast 提示
- 从右侧滑入 `translateX(100%→0)`
- 自动消失前渐隐 `opacity 1→0`
- 持续 3s

---

## 七、实现方式

| 效果 | 技术 | 依赖 |
|------|------|------|
| 滚动揭示 | Intersection Observer + CSS class | 0 依赖 |
| 毛玻璃导航 | CSS `backdrop-filter` | 0 依赖 |
| 渐变光晕 | CSS `radial-gradient` + `blur` | 0 依赖 |
| 网格底纹 | CSS `linear-gradient` + `mask-image` | 0 依赖 |
| 数字递增 | 简单 JS（requestAnimationFrame） | 0 依赖 |
| Tab 滑动下划线 | CSS `transition` + 计算 left/width | 0 依赖 |
| 卡片悬停 | CSS `transition` + `transform` | 0 依赖 |
| 输入框聚焦 | CSS `:focus-visible` | 0 依赖 |
| 顶部进度条 | CSS animation + Next.js router events | 0 依赖 |

**全部零外部依赖**，纯 CSS + 少量 vanilla JS。

---

## 八、不做的事

- ❌ 不做视差滚动（parallax）— 容易晕，手机端兼容差
- ❌ 不做全屏动画/loading screen — 拖慢首屏
- ❌ 不做鼠标跟随光效 — 炫技但增加复杂度
- ❌ 不做页面间 transition — Next.js 14 App Router 支持差
- ❌ 不引入 framer-motion / GSAP — 包大，overkill
