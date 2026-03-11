import { test, expect } from '@playwright/test'

test.describe('管理后台访问控制', () => {
  test('未登录访问 /admin → 重定向到登录', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(3000)
    const url = page.url()
    // 应该重定向到登录页，不应该直接显示管理后台
    expect(url).not.toBe('http://localhost:3000/admin')
  })

  test('未登录访问 /admin/users → 重定向', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).not.toContain('/admin/users')
  })
})
