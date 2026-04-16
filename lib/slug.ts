import { pinyin } from 'pinyin-pro'

/**
 * 将任意字符串（含中文）转换为 URL 友好的英文 slug
 * 例：北京-中关村AI北纬社区 → bei-jing-zhong-guan-cun-ai-bei-wei-she-qu
 */
export function toEnglishSlug(input: string): string {
  const py = pinyin(input, {
    toneType: 'none',
    separator: '-',
    nonZh: 'consecutive',
  })
  return py
    .toLowerCase()
    .replace(/[·•·\s（）()【】「」《》、，。！？；：""'']+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 判断字符串是否包含中文
 */
export function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str)
}

/**
 * 确保 slug 是英文：如果含中文则自动转换
 */
export function ensureEnglishSlug(slug: string): string {
  if (hasChinese(slug)) {
    return toEnglishSlug(slug)
  }
  return slug
}
