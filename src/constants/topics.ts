export const TOPICS = [
  { id: 'indie-dev', name: '独立开发', color: '#FF6B35' },
  { id: 'side-hustle', name: '副业变现', color: '#1E3A5F' },
  { id: 'opc', name: '一人公司', color: '#28A745' },
  { id: 'freelance', name: '自由职业', color: '#FFC107' },
  { id: 'global', name: '出海创业', color: '#007BFF' },
  { id: 'ai', name: 'AI创业', color: '#6F42C1' },
  { id: 'content', name: '内容创作', color: '#E83E8C' },
  { id: 'saas', name: 'SaaS', color: '#20C997' },
  { id: 'knowledge', name: '知识付费', color: '#FD7E14' },
  { id: 'remote', name: '远程工作', color: '#6C757D' },
] as const

export const POST_TYPES = [
  { id: 'DAILY', name: '日常动态', description: '创业日记、进度分享' },
  { id: 'EXPERIENCE', name: '经验分享', description: '实战经验、踩坑总结' },
  { id: 'QUESTION', name: '问题求助', description: '遇到的问题和困惑' },
  { id: 'RESOURCE', name: '资源推荐', description: '好用的工具、资源' },
  { id: 'DISCUSSION', name: '观点讨论', description: '行业观点、趋势探讨' },
] as const

// ==================== 合作广场 ====================

// 内容类型
export const CONTENT_TYPES = [
  { id: 'DEMAND', name: '需求订单', description: '发布开发、设计等需求', color: '#007BFF' },
  { id: 'COOPERATION', name: '合作需求', description: '寻找合伙人或外包合作', color: '#28A745' },
] as const

// 接单市场分类
export const MARKET_CATEGORIES = [
  '网站开发',
  'App开发',
  '小程序开发',
  'AI应用',
  'UI设计',
  '品牌设计',
  '产品设计',
  '运营推广',
  'SEO优化',
  '内容创作',
  '技术咨询',
  '商业咨询',
  '其他',
] as const

// 预算类型
export const BUDGET_TYPES = [
  { id: 'NEGOTIABLE', name: '面议' },
  { id: 'FIXED', name: '固定价格' },
  { id: 'RANGE', name: '价格区间' },
] as const
