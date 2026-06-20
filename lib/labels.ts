/**
 * mainTracks 字段的预设标签定义
 * 迁移说明：旧 key ai_product → ai_saas，其余同名，other → []（空数组）
 */

export const MAIN_TRACK_MAP: Record<string, string> = {
  ai_saas:    'AI 产品 / SaaS',
  content:    '内容创作 / 自媒体',
  ecommerce:  '电商 / 独立站',
  consulting: '咨询 / 知识服务',
  dev:        '独立开发 / 外包',
  design:     '设计 / 创意',
}

export const MAIN_TRACK_OPTIONS = Object.entries(MAIN_TRACK_MAP).map(
  ([value, label]) => ({ value, label })
)

/** 把 mainTracks 数组的 value 转为可读 label，找不到映射则原样返回 */
export function resolveTrackLabel(value: string): string {
  return MAIN_TRACK_MAP[value] ?? value
}
