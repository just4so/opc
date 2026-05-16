export const SEARCH_QUERIES: Record<string, string[]> = {
  policy: [
    "OPC 政策 补贴 {city} 2026",
    "一人公司 若干措施 {city}",
    "众创空间 扶持 {city}",
  ],
  community: [
    "OPC社区 开业 揭牌 {city}",
    "一人公司社区 入驻 招募 {city}",
    "众创空间 开园 {city} 2026",
  ],
  event: [
    "OPC 创业大赛 报名 2026",
    "一人公司 路演 沙龙 {city}",
    "AI创业 比赛 {city} 2026",
  ],
  resource: [
    "算力券 申请 开放 2026",
    "创业补贴 申报 {city}",
  ],
}

export const CITIES = [
  "北京", "上海", "深圳", "广州", "杭州",
  "成都", "武汉", "南京", "西安", "重庆",
  "天津", "宁波", "长沙", "郑州", "沈阳",
]

// 关键词预过滤（仅用于 tier3 泛源），标题或内容含以下之一才进 AI 处理
// 只保留 OPC 强相关词，避免「孵化器」「补贴」等泛化词引入大量噪音
export const FILTER_KEYWORDS = [
  "OPC", "一人公司", "超级个体", "OPC社区", "独立创业", "算力券",
]
