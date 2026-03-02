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

export const PROJECT_STAGES = [
  { id: 'IDEA', name: '想法阶段', color: '#6C757D' },
  { id: 'BUILDING', name: '开发中', color: '#FFC107' },
  { id: 'LAUNCHED', name: '已上线', color: '#007BFF' },
  { id: 'REVENUE', name: '有收入', color: '#28A745' },
  { id: 'PROFITABLE', name: '已盈利', color: '#FF6B35' },
] as const

export const PROJECT_CATEGORIES = [
  'SaaS',
  '工具',
  'AI应用',
  '内容平台',
  '电商',
  '教育',
  '效率',
  '设计',
  '开发者工具',
  '社区',
  '其他',
] as const
