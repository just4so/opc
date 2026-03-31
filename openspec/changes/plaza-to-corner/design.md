## Context

OPC圈目前有两个独立广场入口：「创业广场」(`/plaza`, `Post` model, 123条) 和「合作广场」(`/market`, `Project` model, DEMAND+COOPERATION 22条)。两者共享用户群但分开维护，导致导航冗余和代码重复。

**当前状态：**
- Post 表：PostType 5值（DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION），纯文本内容
- Project 表：BudgetType/ContactType 等合作字段，22条 DEMAND/COOPERATION 数据（Like/Favorite/Comment 全部为0）
- 已有 Tiptap 编辑器组件（`components/admin/rich-text-editor.tsx`），但仅用于 admin
- 已有 R2 图片上传（`/api/admin/upload/community-image`），但要求 staff 权限
- sanitize-html v2.17.2 已安装，Tiptap 全套已安装

## Goals / Non-Goals

**Goals:**
- 合并两个广场为「交流广场」，单一入口，4类型 Tab 筛选
- Post 表扩字段承接 COLLAB（合作）类帖子的结构化信息
- 迁移 22条 Project 数据 → Post（type=COLLAB），停止 Project 写入
- 发布页引入 Tiptap 富文本，支持图片上传
- TagInput 支持自由标签+搜索已有标签
- 移动端 Tab → 下拉选择器

**Non-Goals:**
- 不做帖子编辑功能
- 不改 /plaza URL
- 不做复杂富文本（表格/字体颜色等）
- /market 路由保留但返回空数组（不做跳转/SEO处理）
- Project 表不删除，仅停止写入

## Decisions

### 1. Post 表直接扩字段，不新建 COLLAB 子表

**决定**：在 `Post` 表新增 `title?`, `contentHtml?`, `budgetMin?`, `budgetMax?`, `budgetType?`, `deadline?`, `skills[]`, `contactInfo?`, `contactType?` 字段。

**理由**：22条 COLLAB 数据量极小，COLLAB 帖子和普通帖子在 Feed、互动、权限上完全一致，单表查询更简单，避免 JOIN。若 COLLAB 体量增长到需要独立功能（如筛选/合同管理），再拆表。

**替代方案**：新建 `CollabPost` 关联表 → 过度设计，当前数据量不值得。

### 2. PostType 旧值迁移后删除

**决定**：数据迁移脚本执行后，从 Prisma schema 删除旧 enum 值（DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION），保持 enum 干净。

**理由**：旧值迁移完成后无任何引用，保留只会增加混淆。Prisma enum 修改需要 `db:push`，但没有外部消费者依赖这些值（无 API 合约需兼容）。

**风险**：如果有漏删的旧值数据，Prisma 会报错。迁移脚本须验证 COUNT。

### 3. 复用并扩展 admin RichTextEditor，新建独立 PostRichTextEditor

**决定**：不直接复用 `components/admin/rich-text-editor.tsx`，而是在 `components/plaza/post-rich-text-editor.tsx` 新建一个面向普通用户的版本（简化工具栏，复用 Tiptap 扩展配置）。

**理由**：admin 编辑器包含 admin-only 图片上传逻辑（要求 staff 权限），前台用户编辑器需要独立的 `/api/upload/post-image` 端点（普通登录用户即可上传）。toolbar 也应更简洁。

### 4. contentHtml 存储，content 字段保留作为纯文本预览

**决定**：`contentHtml` 存 Tiptap 输出的 HTML（服务端 sanitize 后存储），`content` 保留作为 strip-HTML 后的纯文本（用于卡片预览、全文搜索）。渲染时优先用 `contentHtml`，为空则用 `content`（兼容旧数据）。

**理由**：`content` 字段现有大量旧数据，不破坏旧帖子显示。卡片预览不需要解析 HTML，直接用 `content` 纯文本更高效。

### 5. /api/tags/search 从 Post.topics 聚合，无独立 Tag 表

**决定**：标签候选直接从 `Post.topics` 字段聚合统计，按频次排序返回，不建独立 Tag 表。

**理由**：当前 topics 是 `String[]` 存储，无需额外维护。TagInput 搜索场景下，实时聚合查询（加缓存）性能足够。若未来需要官方标签管理，再引入 Tag 表。

### 6. 移动端 Tab → 原生 `<select>`

**决定**：移动端用原生 `<select>` 下拉，不用自定义 Dropdown 组件。

**理由**：原生 select 在移动端体验最佳（系统原生选择器），零依赖，无 z-index 问题。外观用 TailwindCSS 修饰即可满足设计需求。

## Risks / Trade-offs

- **[Risk] 迁移脚本失误导致数据丢失** → Mitigation: 脚本先打印基准 COUNT，迁移后验证，使用 Prisma transaction 保证原子性；生产执行前在 staging 验证
- **[Risk] Prisma enum 修改需要停机** → Mitigation: `db:push` 在低峰期执行；旧值删除前确认迁移100%完成
- **[Risk] contentHtml XSS** → Mitigation: 服务端存储前用 sanitize-html 白名单过滤；渲染时用 `dangerouslySetInnerHTML`（已 sanitize）
- **[Risk] R2 图片上传权限** → Mitigation: 新 `/api/upload/post-image` 只需登录用户（非 staff），检查 session 即可；复用现有 R2 SDK 配置
- **[Trade-off] Project 表数据迁移后停止写入但不删表** → 保留历史数据，admin/market 页面可能显示空列表，可接受

## Migration Plan

1. **Schema 变更**：Post 表加字段 + PostType 加新值（保留旧值）→ `db:push`
2. **代码部署**：新 API、新前端组件上线（此时新旧 PostType 值共存，前端兼容处理）
3. **执行迁移脚本**：`scripts/migrate-plaza.ts`（映射旧 Post type + 迁移 22条 Project → Post）
4. **验证**：脚本输出前后 COUNT 对比，人工抽查几条数据
5. **删旧值**：从 schema 删除 DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION → `db:push`
6. **收尾**：`/api/market` 返回空数组（已在代码中处理）

**Rollback**：步骤1-2 可回滚（向前兼容）；步骤3 迁移后难以回滚（需备份或重新映射）；步骤5 不可回滚，须确认步骤3-4 通过后再执行。

## Open Questions

- 左侧栏「活跃用户」排行：用近7天发帖数还是总发帖数？（建议近7天，更动态）
- COLLAB 帖子的 `contactInfo` 字段：未登录用户返回 null，登录用户返回原文——是否需要额外的「联系Ta」交互层？（当前方案：直接展示，不另做交互）
