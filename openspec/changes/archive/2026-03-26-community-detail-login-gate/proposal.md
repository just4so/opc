## Why

当前社区详情页所有信息对未登录用户完全开放，用户缺乏注册动机。需要对敏感信息（精确地址、联系方式、入驻流程、配套服务、政策扶持）加登录门控，通过毛玻璃遮罩+注册引导，将内容价值转化为注册转化率。采用免费层/注册层两档模型（付费层暂不实现），注册后即可解锁全部内容。

## What Changes

- 新建 `LoginGate` 通用组件：毛玻璃遮罩 + 注册引导按钮，用于包裹需要门控的内容区域
- 社区详情页 7 项信息分层门控：
  - 精确地址（address）整体遮罩
  - 联系方式（contactName/contactPhone/contactWechat）整体遮罩
  - 入驻流程（entryProcess）显示步数 + 整体遮罩
  - 配套服务（services）前 2 项可见 + 其余遮罩
  - 政策扶持（policies）整体遮罩
  - 地图下方增加注册提示（仅未登录时）
- 侧边栏 CTA 改造：未登录时展示注册权益列表卡片替代当前的「开启你的AI创业之旅」

## Capabilities

### New Capabilities
- `login-gate`: 社区详情页信息分层门控组件及页面改造，包括 LoginGate 组件、7 项门控区域改造、侧边栏 CTA 改造

### Modified Capabilities

## Impact

- **页面文件**: `app/(main)/communities/[slug]/page.tsx` — 添加 `auth()` 调用获取 session，传递 `isLoggedIn` 给门控组件
- **新增组件**: `components/community/login-gate.tsx` — Client Component
- **依赖**: NextAuth `auth()` 函数（已有）
- **无破坏性变更**: 已登录用户体验不变，未登录用户可见的信息从全部变为部分
