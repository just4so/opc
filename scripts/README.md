# Scripts 目录说明

> 最后更新：2026-03-31

## 还在使用的脚本

| 文件名 | 用途 | 如何运行 |
|--------|------|---------|
| `fetch-news.ts` | 从 RSS 源（36氪、少数派）采集并入库新闻，按关键词过滤，自动分类 | `npm run fetch:news` |
| `fix-counts.ts` | 修正 Post 表的 likeCount / commentCount 与实际 Like/Comment 记录不一致的问题 | `npx tsx scripts/fix-counts.ts` |
| `seed-avatars.ts` | 给 avatar 为空的用户分配 DiceBear bottts 风格默认头像（idempotent） | `npx tsx scripts/seed-avatars.ts` |
| `update-coordinates.js` | 调用百度地图 Geocoding API，为缺少经纬度的社区补全坐标 | `node scripts/update-coordinates.js` |

## 历史/一次性脚本（已完成，不再需要运行）

| 文件名 | 说明 |
|--------|------|
| `analyze-data.ts` | 对比本地 Excel 表与数据库，找出重复和缺失社区（依赖本地文件路径，已失效） |
| `cleanup-communities.ts` | 删除同名同城重复社区、合并相似名称社区（已清理完毕） |
| `migrate-notes.ts` | 将 `community.notes[]` 字段内容迁移到 `realTips[]`（schema 字段重命名，已完成） |
| `migrate-slugs.ts` | 为所有 ACTIVE 状态社区生成 `newSlug` 字段（一次性数据迁移，已完成） |
| `migrate-username-to-name.ts` | 将 `name = null` 的用户的 `username` 复制到 `name` 字段（schema 新增字段后的数据补全） |
| `seed-communities.ts` | 从 Excel 批量导入社区初始数据（初始建站时运行） |
| `seed-community-tips.ts` | 写入各城市社区的「真实入驻说明」和「入驻难度」数据 |
| `seed-plaza.ts` | 创业广场冷启动：创建 20 个虚拟用户、帖子和评论 |
| `seed-week2.ts` | Week 2 种子数据：5 篇原创资讯 + 20 条合作广场数据 + 补全用户赛道字段 |

## 内部工具

| 文件名 | 说明 |
|--------|------|
| `ralph_loop.py` | OpenClaw 任务状态管理器（内部开发流程工具，不依赖数据库） |

## 注意事项

- 运行任何迁移脚本前请先备份数据库
- 生产环境需要在 `.env` 中配置 `DATABASE_URL`（Transaction mode，端口 6543）和 `DIRECT_URL`（端口 5432）
- 历史脚本保留在此仅供参考，切勿在已运行过的生产数据库上重新执行
