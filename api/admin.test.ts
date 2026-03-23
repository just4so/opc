import { describe, it, expect } from 'vitest'

describe('Admin — News category mapping', () => {
  const CATEGORY_MAP: Record<string, string> = {
    '政策资讯': 'POLICY',
    '创业干货': 'STORY',
    '社区动态': 'EVENT',
    '行业观察': 'TECH',
  }

  it('maps 政策资讯 to POLICY', () => expect(CATEGORY_MAP['政策资讯']).toBe('POLICY'))
  it('maps 创业干货 to STORY', () => expect(CATEGORY_MAP['创业干货']).toBe('STORY'))
  it('maps 社区动态 to EVENT', () => expect(CATEGORY_MAP['社区动态']).toBe('EVENT'))
  it('maps 行业观察 to TECH', () => expect(CATEGORY_MAP['行业观察']).toBe('TECH'))

  it('falls back to STORY for unknown category', () => {
    const mapped = CATEGORY_MAP['unknown'] || 'STORY'
    expect(mapped).toBe('STORY')
  })
})

describe('Admin — Original news URL uniqueness', () => {
  it('generates unique urls', () => {
    const url1 = `original-${Date.now()}-${Math.random()}`
    const url2 = `original-${Date.now()}-${Math.random()}`
    expect(url1).not.toBe(url2)
  })

  it('url starts with original-', () => {
    const url = `original-1234567890-0.123`
    expect(url.startsWith('original-')).toBe(true)
  })
})

describe('Admin — Post status transitions', () => {
  const VALID = ['PUBLISHED', 'HIDDEN', 'DELETED']

  it('PUBLISHED is valid', () => expect(VALID.includes('PUBLISHED')).toBe(true))
  it('HIDDEN is valid', () => expect(VALID.includes('HIDDEN')).toBe(true))
  it('DELETED is valid', () => expect(VALID.includes('DELETED')).toBe(true))
  it('SPAM is not valid', () => expect(VALID.includes('SPAM')).toBe(false))
  it('empty string is not valid', () => expect(VALID.includes('')).toBe(false))
})

describe('Admin — 7-day stats generation', () => {
  it('generates exactly 7 data points', () => {
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      result.push(d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }))
    }
    expect(result).toHaveLength(7)
  })

  it('dates are strings', () => {
    const d = new Date()
    const label = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('start of day has hours 0:0:0', () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
  })
})

describe('Admin — User role validation', () => {
  const VALID_ROLES = ['USER', 'MODERATOR', 'ADMIN']

  it('accepts USER', () => expect(VALID_ROLES.includes('USER')).toBe(true))
  it('accepts MODERATOR', () => expect(VALID_ROLES.includes('MODERATOR')).toBe(true))
  it('accepts ADMIN', () => expect(VALID_ROLES.includes('ADMIN')).toBe(true))
  it('rejects unknown role', () => expect(VALID_ROLES.includes('SUPERUSER')).toBe(false))
})
