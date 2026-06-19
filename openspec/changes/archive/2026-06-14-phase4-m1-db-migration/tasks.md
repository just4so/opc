# Phase 4 M1: DB Schema + 数据迁移

> 归档时间: 2026-06-14
> 执行方式: 主 Agent 直接执行（非 ACP）
> 状态: ✅ 完成

## 完成内容

- [x] `prisma/schema.prisma` 新增 `Inquiry.acceptInterview Boolean @default(false)`
- [x] `prisma/schema.prisma` `enum PostType` 新增 `DEMAND` 值
- [x] `npx prisma db push` 推送 schema 变更
- [x] 数据迁移：CHAT/PROGRESS/RESOURCE → SHARE（66条），COLLAB/HELP → DEMAND（76条）
- [x] 清理 milestone/projectId 字段（2条）
- [x] `tsconfig.json` 排除 `tmp/` 目录（顺带修复）
- [x] `npm run build` 通过（206/206 页面）

## 迁移后数据

| 类型 | 数量 |
|------|------|
| SHARE | 158 |
| DEMAND | 76 |
| 其余旧类型 | 0 |
