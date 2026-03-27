import { pinyin } from 'pinyin-pro'

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })

/**
 * Convert a text segment into pinyin words.
 * Chinese words get their characters joined (上海 → shanghai).
 * ASCII runs are preserved as-is (lowercased).
 */
function toPinyinWords(text: string): string[] {
  const segments = Array.from(segmenter.segment(text))
  const words: string[] = []

  for (const { segment, isWordLike } of segments) {
    if (!isWordLike) continue
    if (/[\u4e00-\u9fff]/.test(segment)) {
      // Chinese word — convert each char to pinyin and join
      const py = pinyin(segment, { toneType: 'none', type: 'array' }).join('')
      if (py) words.push(py)
    } else {
      // ASCII / alphanumeric
      const clean = segment.replace(/[^a-zA-Z0-9]/g, '')
      if (clean) words.push(clean)
    }
  }

  return words
}

/**
 * Convert Chinese city + name into a lowercase, hyphen-separated pinyin slug.
 * ASCII alphanumeric chars are preserved (lowercased). Max 60 chars, truncated at hyphen boundary.
 */
export function generateSlug(city: string, name: string): string {
  const parts = [city, name].filter((s) => s.trim())
  if (parts.length === 0) return ''

  const words = parts.flatMap((part) => toPinyinWords(part))
  let slug = words.join('-').toLowerCase()

  if (slug.length > 60) {
    slug = slug.slice(0, 61)
    const lastHyphen = slug.lastIndexOf('-')
    slug = lastHyphen > 0 ? slug.slice(0, lastHyphen) : slug.slice(0, 60)
  }

  return slug
}

/**
 * Generate a slug guaranteed unique against existingSlugs.
 * Appends -2, -3, etc. on collision.
 */
export function generateUniqueSlug(
  city: string,
  name: string,
  existingSlugs: string[]
): string {
  const base = generateSlug(city, name)
  if (!existingSlugs.includes(base)) return base

  let counter = 2
  while (existingSlugs.includes(`${base}-${counter}`)) {
    counter++
  }
  return `${base}-${counter}`
}

/**
 * Return true if the string contains any CJK Unified Ideographs characters.
 */
export function isChinese(slug: string): boolean {
  return /[\u4e00-\u9fff]/.test(slug)
}
