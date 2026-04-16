# 社区数据模型规范 (Community Schema)

本文档定义了 `opcquan.com` 中 `Community` 表的数据结构规范。**所有后端数据迁移、前端页面重构及日常数据录入均必须遵循此规范。**

---

## 1. 基础标识
- `id` (String): 系统自动生成的唯一标识符（主键）。
- `slug` (String): URL路径标识，如 `ningbo-hai-shu-aiopc-shequ`，全小写英文+连字符。
- `name` (String): 社区完整名称，如"海曙AiOPC社区"。
- `status` (Enum): 上架状态：`ACTIVE`=正常展示 / `INACTIVE`=下架 / `PENDING`=待审核。
- `featured` (Boolean): 是否加入精选推荐位。

## 2. 位置信息
- `city` (String): 所在城市，如"宁波"。
- `district` (String): 所在区/县，如"海曙区"。
- `address` (String): 详细街道地址，如"宁波市海曙区白云街道前丰街80号"。
- `latitude` (Float): 纬度坐标（用于地图展示）。
- `longitude` (Float): 经度坐标（用于地图展示）。
- `transit` (String, 可选): 最近公共交通信息，格式："地铁X号线XX站，步行约XX分钟"；无地铁则填公交或停车信息。

## 3. 社区基本情况
- `description` (String): 社区简介，100-200字，描述真实定位和核心特色，不堆砌政策条款。
- `operator` (String): 运营方全名，如"宁波阿里中心（阿里巴巴合作运营）"。
- `type` (Enum): 社区类型：`COWORKING`=纯共享办公 / `INCUBATOR`=孵化器 / `GOVERNMENT`=政府主导 / `MIXED`=混合型。
- `focusTracks` (String[]): 社区重点支持的创业赛道，从社区定位角度填写，如 `["AI", "跨境电商"]`。
- `suitableFor` (String[]): 适合入驻的创业者画像，从用户角度填写，如 `["有初步订单的AI创业者"]`。
- `totalWorkstations` (Int, 可选): 社区总工位数量。
- `totalArea` (String, 可选): 社区总面积，带单位，如"3000㎡"；不知道总面积填单个工位最小面积，如"最小5㎡/工位"。
- `coverImage` (String): 封面图URL（建议800×500px，存R2）。
- `images` (String[]): 社区实景图集URL列表。
- `website` (String, 可选): 官方网站或公众号链接。

## 4. 联系方式
- `contactName` (String, 可选): 入驻对接联系人姓名，如"戴老师"。
- `contactPhone` (String, 可选): 联系电话（优先填能直接联系到人的手机号，其次是400/座机）。
- `contactWechat` (String, 可选): 微信号或微信公众号名称。
- `contactNote` (String, 可选): 联系备注，如"工作日9:00-18:00"、"加微信备注OPC入驻"。

## 5. 入驻信息
- `applyDifficulty` (Int): 入驻友好度评分，1-5分，5=最容易入驻。
- `entryInfo` (Json, 可选): 入驻完整信息，包含以下三个Key：
  - `requirements` (String[]): 入驻硬性条件，如 `["需提供订单佐证"]`。
  - `steps` (String[]): 申请流程步骤，如 `["提交BP", "审核"]`。
  - `duration` (String): 审核总时长，如"10-15个工作日"。
- `lastVerifiedAt` (Date): 本条信息最后人工核实的日期。

## 6. 五大政策福利 (benefits)
统一存储在 `benefits` 字段 (Json) 中。有对应政策就填该对象，没有则省去该 key。

每个分类结构包含：
- `summary` (String): 一句话概括。
- `items` (String[]): 具体条款列表。

支持的五大分类键值：
- `office` (办公空间): 工位价格/期限/面积/注册地/共享设施。
- `compute` (算力资源): 算力规模/类型/价格/补贴/数据开放。
- `business` (业务拓展): 订单来源/场景数量/开单奖励/大企业资源。
- `funding` (资金支持): 贷款/基金/补贴奖励/大赛/保险。
- `housing` (安居保障): 公寓套数/折扣/驿站/租房补贴。

## 7. 真实提示
- `realTips` (String[]): 入驻前必须知道的真实信息，重点写：隐性费用、条件限制、容易踩的坑、和官方宣传不一致的地方。

## 8. 废弃字段清理计划

M1-M3 重构完成后，以下旧字段已被新字段替代，**不再录入新数据**。当满足下方「删除条件」后，执行 Prisma Migration 统一清除。

### 待删除字段

| 旧字段 | 替代字段 | 说明 |
|--------|---------|------|
| `policies` (Json) | `benefits` (Json) | 非结构化政策文本 → 五大结构化福利 |
| `services` (String[]) | `benefits.office.items` 等 | 服务列表已拆入对应 benefit 分类 |
| `links` (Json) | 前端参考链接组件 | 非结构化链接 |
| `focus` (String[]) | `focusTracks` (String[]) | 字段重命名 |
| `entryProcess` (String[]) | `entryInfo.steps` (String[]) | 已迁入 entryInfo 结构体 |
| `workstations` (Int) | `totalWorkstations` (Int) | 字段重命名 |
| `spaceSize` (String) | `totalArea` (String) | 字段重命名 |
| `newSlug` (String) | `slug` (String) | newSlug 值已统一赋给 slug |

### 删除条件（全部满足后方可执行）

1. **前端无引用**：`grep -r "policies\|entryProcess\|spaceSize\|workstations\|newSlug\|\.focus" app/ components/` 无命中（注意排除 focusTracks）
2. **后台无写入**：`community-form.tsx` 和所有 API route 中不再向旧字段写数据
3. **新字段覆盖率 100%**：所有 143 条记录的 `benefits`、`entryInfo`、`focusTracks` 均非空
4. **已通过完整回归测试**：社区列表页、详情页、后台编辑页功能正常

### 执行步骤
```bash
# 1. 确认无前端引用
grep -r "policies\|entryProcess\|spaceSize\|\.focus[^T]" app/ components/

# 2. 执行 Prisma Migration 删除旧字段
npx prisma migrate dev --name remove_legacy_community_fields

# 3. 删除 Schema 中对应字段后跑类型检查
npx tsc --noEmit
```

*(注：`links` 字段当前后台表单还有 UI 录入入口，删除前需一并移除表单中的 links 编辑组件。)*