## Why

「创业广场」和「合作广场」是两个独立入口，但用户行为高度重叠——创业者在广场发帖、找合作、求助本质上是同一个场景。分开维护带来导航冗余、代码重复，也让用户在两个入口之间反复横跳。现在合并重设计为「交流广场」，一个入口覆盖全部交流需求，降低认知负担。

## What Changes

- **名称**：页面显示名「创业广场」→「交流广场」，URL `/plaza` 保留不变
- **PostType enum 重设计**：旧5值（DAILY/EXPERIENCE/QUESTION/RESOURCE/DISCUSSION）→ 新4值（CHAT/HELP/SHARE/COLLAB），旧数据迁移后删除旧值
- **Post 表扩字段**：新增 `title`、`contentHtml`、`budgetMin`、`budgetMax`、`budgetType`、`deadline`、`skills`、`contactInfo`、`contactType`，支持 COLLAB 类帖子的合作信息
- **Project 表数据迁移**：22条 DEMAND/COOPERATION 记录迁移至 Post 表，type=COLLAB；Project 表保留但停止写入
- **富文本编辑器**：发布页引入 Tiptap 编辑器，替代纯文本 textarea；输出 HTML 存 `contentHtml`，strip 后存 `content`
- **发布页重构**：/plaza/new 改为4类型意图卡片选择 + 通用字段 + COLLAB 额外字段
- **帖子卡片重设计**：展示标题、类型标签（颜色区分）、COLLAB 预算信息
- **Tab 改下拉（移动端）**：5个 Tab 在移动端改为 `<select>` 下拉选择器
- **导航栏**：移除「合作广场」独立入口，「创业广场」→「交流广场」
- **新增 API**：`GET /api/tags/search`（标签候选搜索）、`POST /api/upload/post-image`（图片上传）
- **`/api/market` 保留**：返回空数组，前端迁移完成后再移除
- **TagInput 组件**：自由输入 + 搜索已有标签，最多5个，回车/逗号创建
- **RichTextEditor 组件**：封装 Tiptap，支持图片上传，渲染用 sanitize-html 过滤

## Capabilities

### New Capabilities
- `plaza-unified-feed`: 合并广场 Feed，支持 CHAT/HELP/SHARE/COLLAB 四类型 Tab 筛选，PC端 Tab + 移动端下拉，左侧栏热议话题/活跃用户/统计
- `plaza-post-create`: 发布页重构，4类意图卡片 + Tiptap 富文本 + TagInput + COLLAB 额外字段（预算/截止/技能/联系方式）
- `plaza-post-card`: 帖子卡片重设计，展示标题、类型标签色彩、COLLAB 预算截止信息
- `plaza-data-migration`: Post 类型迁移脚本 + Project→Post 迁移脚本，含前后 COUNT 验证
- `tag-input`: TagInput 通用组件，实时搜索 /api/tags/search，支持自由创建，最多5个
- `rich-text-editor`: RichTextEditor 组件封装 Tiptap，图片上传，sanitize-html 渲染

### Modified Capabilities
<!-- No existing spec-level requirement changes -->

## Impact

- **Schema**：`Post` 表新增9个字段，`PostType` enum 新增4值（迁移后删5旧值）
- **API**：`GET/POST /api/posts` 扩字段，新增 `/api/tags/search`、`/api/upload/post-image`，`/api/market` 返回空数组
- **Pages**：`/plaza/page.tsx`（Feed 重设计）、`/plaza/new/page.tsx`（发布页重构）
- **Components**：`PlazaClient`、`PostCard`、`TagInput`（新建）、`RichTextEditor`（新建或复用）
- **Navigation**：header/nav 组件移除「合作广场」链接，更新「交流广场」文字
- **Data Migration**：`scripts/migrate-plaza.ts` 一次性脚本
- **依赖**：sanitize-html（已安装）、Tiptap 全套（已安装）
