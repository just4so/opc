# V2 交互优化规格书

> 参考：Vercel（导航/按钮）、Notion（入场动画/卡片）、Stripe（光效/hover）、Linear（网格动效）
> 原则：**轻量、一致、有目的**。不为炫技加动画，每个动效都服务于"引导用户注意力"。

---

## 全局交互规范

### 1. 统一 easing 函数
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);    /* 主力缓动：快进慢出 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* 弹性：按钮/徽章 */
--ease-subtle: cubic-bezier(0.45, 0, 0.55, 1);       /* 微妙：颜色/透明度 */
```

### 2. 统一时长
| 类型 | 时长 | 用途 |
|------|------|------|
| 即时反馈 | 100-150ms | hover 颜色、背景变化 |
| 标准过渡 | 200-300ms | 卡片 hover、导航切换 |
| 入场动画 | 400-600ms | ScrollReveal、页面区块出现 |
| 强调动画 | 800-1500ms | 数字计数、首屏入场 |

---

## 具体交互清单

### A. 首页 Hero 入场序列（参考 Notion）
**现状：** 所有内容同时出现，没有节奏感
**目标：** 依次入场，引导视线从标题→副标题→按钮

```
时间轴：
0ms     — 标题开始 fadeInUp（opacity 0→1, translateY 30→0）
200ms   — 第二行渐变文字入场
400ms   — 副标题入场
600ms   — 两个按钮入场
800ms   — "不确定？" 链接入场
```

实现：给每个元素加 CSS animation + animation-delay，不用 JS。
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.hero-animate {
  opacity: 0;
  animation: fadeInUp 0.6s var(--ease-out-expo) forwards;
}
.hero-delay-1 { animation-delay: 0.2s; }
.hero-delay-2 { animation-delay: 0.4s; }
.hero-delay-3 { animation-delay: 0.6s; }
.hero-delay-4 { animation-delay: 0.8s; }
```

### B. ScrollReveal 增强（参考 Vercel）
**现状：** 单一的 fadeInUp，所有区块同一动画
**目标：** 区块内子元素有错落感

改进 ScrollReveal 组件：
- 加 `stagger` prop：子元素每个延迟 100ms
- 加 `direction` prop：支持 fromLeft/fromRight（侧边内容）
- 保持 `prefers-reduced-motion` 尊重

### C. 卡片交互升级（参考 Vercel + Notion）
**现状：** hover 只有 shadow + translateY(-4px)
**目标：** hover 时边框从 hairline-soft 渐变到更明显的色调 + 微妙阴影扩散

```css
.card-interactive {
  border: 1px solid var(--hairline-soft);
  transition: 
    border-color 0.25s var(--ease-subtle),
    box-shadow 0.25s var(--ease-subtle),
    transform 0.25s var(--ease-out-expo);
}
.card-interactive:hover {
  border-color: var(--hairline);
  box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}
```

### D. 按钮交互（参考 Vercel）
**现状：** hover 只有颜色变化
**目标：** 按下有 scale 反馈，hover 有微妙的亮度提升

```css
.btn-primary {
  transition: 
    background-color 0.15s var(--ease-subtle),
    box-shadow 0.2s var(--ease-subtle),
    transform 0.1s var(--ease-spring);
}
.btn-primary:hover {
  filter: brightness(1.05);
  box-shadow: 0 4px 20px rgba(249,115,22,0.25);
}
.btn-primary:active {
  transform: scale(0.98);
}
```

### E. 导航滚动感知（参考 Vercel/Notion）
**现状：** 固定毛玻璃，始终有 border-bottom
**目标：** 页面顶部时导航透明无边框，滚动后渐变出毛玻璃 + 边框

需要一个轻量的 client component 监听 scroll：
```tsx
// 伪代码
const scrolled = useScroll(50) // 超过 50px 返回 true
<header className={scrolled ? 'glass-nav border-b border-hairline-soft' : 'bg-transparent'}>
```

### F. 深色数据区数字入场（已有 AnimatedCounter，增强）
**现状：** 数字从 0 数上去
**增强：** 数字入场时有 scale 放大效果（1.1→1.0），配合计数完成

### G. 价值卡片区 — 区块标题入场
**现状：** "为什么选择 OPC圈" + "三个动作" 直接显示
**目标：** 标题滑入 + 三张卡片依次从底部升起（100ms 间隔）

### H. 页面级过渡（可选，P2）
**现状：** 页面切换硬切
**目标：** 用 Next.js `loading.tsx` + fade transition 做页面切换过渡

---

## 不做的事
- ❌ 鼠标跟随光效（复杂度高，性能开销大）
- ❌ 3D 翻转/旋转（不符合产品调性）
- ❌ 全屏视差滚动（容易晕、手机端兼容差）
- ❌ Lottie/Canvas 动画（维护成本高）

---

## 实施优先级
| 优先级 | 交互 | 影响范围 |
|--------|------|---------|
| P0 | A. Hero 入场序列 | 首页首屏 |
| P0 | C. 卡片交互升级 | 全站所有卡片 |
| P0 | D. 按钮交互 | 全站所有按钮 |
| P1 | B. ScrollReveal 增强 | 首页+详情页 |
| P1 | E. 导航滚动感知 | 全站 |
| P1 | G. 价值卡片入场 | 首页 |
| P2 | F. 数字入场增强 | 首页 |
| P2 | H. 页面过渡 | 全站 |

## 技术约束
- 所有动画必须支持 `prefers-reduced-motion: reduce`（直接显示，无动画）
- 移动端简化：去掉 hover 效果，保留入场动画
- 性能：只动 `transform` 和 `opacity`（GPU 加速），不动 `width/height/top/left`
