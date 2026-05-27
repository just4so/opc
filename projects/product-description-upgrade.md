# 产品描述字段改造方案

> 创建时间：2026-05-25
> 状态：已合并至 connect-plaza-upgrade-plan.md（任务 2-A 部分）

---

## 背景

广场「产品」标签和个人主页的产品列表，目前只展示 `tagline`（一句话）。
`description` 字段虽然存在于数据库，但：
- 用户没有填写入口
- 前端没有展示
- 直通车创建的产品 description 直接写空字符串

目标：让产品信息有血有肉，展示有长有短的真实内容。

---

## 改动清单（共 8 处，7 个文件）

### 1. 直通车表单
**文件：** `components/connect/connect-form.tsx`

- Label：「一句话介绍产品（选填）」→「简单描述你的产品或服务（选填）」
- placeholder：改为「你在做什么，解决谁的问题，现在到了哪个阶段」
- maxLength：100 → 300

### 2. 直通车 API
**文件：** `app/api/inquiries/route.ts`

- 创建产品时：`description: ''` → `description: productTagline || ''`

### 3. 设置页表单
**文件：** `app/(main)/settings/page.tsx`

- `newProject` state 加 `description: ''` 字段
- tagline 输入框下方加 `Textarea`
  - placeholder：「你在做什么，解决谁的问题，现在到了哪个阶段」
  - 选填，无字数强制要求（建议 maxLength=500）

### 4. 设置页 API
**文件：** `app/api/user/projects/route.ts`

- 接收 `description` 字段
- 创建时：若用户填了 description 用用户填的，否则 fallback 到 tagline
- 校验：description 最长 500 字

### 5. 广场产品卡片
**文件：** `components/plaza/plaza-client.tsx`

- `PlazaProject` interface 加 `description: string | null`
- 卡片结构调整：

```
产品名                         [阶段标签]
tagline（text-sm text-body）

description 默认 line-clamp-2
超出时末尾显示「展开」文字链接
点击后完整展示，变「收起」
─────────────────────────────
头像 姓名 ✓                  📍城市
[了解更多]      [联系创始人]
```

- 视觉细节：
  - description 颜色 `text-mute`，字号 `text-xs`
  - tagline 和 description 之间 `mt-1.5`，不加分割线
  - 「展开/收起」：`text-xs text-ash hover:text-mute cursor-pointer`，右对齐
  - 有/无 description 的卡片底部操作区用 `mt-auto` 保持对齐

### 6. 广场产品 API
**文件：** `app/api/plaza/projects/route.ts`

- select 加 `description: true`

### 7. 广场初始页 SSR
**文件：** `app/(main)/plaza/page.tsx`

- select 加 `description: true`

### 8. 个人主页产品列表
**文件：** `components/profile/profile-client.tsx`

- interface 加 `description: string | null`
- tagline 下方直接完整展示 description（不折叠，个人主页是详情场景）
- 颜色比 tagline 浅一档（`text-xs text-ash`），间距 `mt-1`

---

## 不改的部分

- 搜索 API：已同时搜索 name + tagline + description，无需改动
- admin export：不影响核心功能，暂不改
- 广场「人」标签卡片：只显示产品名，够用

---

## 备注

- 演员账号的 description 字段已有内容（之前 seed 时写入），改完即可展示
- 直通车新创建的产品 description = tagline，用户后续可在设置页补充完善
