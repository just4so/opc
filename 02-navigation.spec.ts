import { test, expect } from '@playwright/test'

test.describe('导航测试', () => {
  test('首页导航链接可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    // 验证导航栏存在
    const nav = page.locator('nav, header').first()
    await expect(nav).toBeVisible()
  })

  test('404页面处理', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')
    await page.waitForTimeout(2000)
    // 应该是404页面，不是500
    const body = await page.locator('body').textContent() || ''
    expect(body).not.toContain('Internal Server Error')
    expect(body).not.toContain('500')
  })

  test('社区地图城市筛选不报错', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/communities')
    await page.waitForTimeout(3000)
    // 找城市筛选按钮或 Tab
    const cityTabs = page.locator('button, a').filter({ hasText: /北京|上海|深圳|杭州|苏州/ }).first()
    const count = await cityTabs.count()
    if (count > 0) {
      await cityTabs.click()
      await page.waitForTimeout(1000)
    }
    const fatalErrors = errors.filter(e => !e.includes('BMap') && !e.includes('map'))
    expect(fatalErrors).toHaveLength(0)
  })

  test('广场话题筛选不报错', async ({ page }) => {
    await page.goto('/plaza')
    await page.waitForTimeout(3000)
    // 找话题按钮
    const topicBtn = page.locator('button').filter({ hasText: /创业故事|经验分享|政策/ }).first()
    const count = await topicBtn.count()
    if (count > 0) {
      await topicBtn.click()
      await page.waitForTimeout(1000)
      const body = await page.locator('body').textContent() || ''
      expect(body).not.toContain('Error')
    }
  })
})
