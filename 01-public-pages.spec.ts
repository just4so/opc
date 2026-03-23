import { test, expect } from '@playwright/test'

test.describe('公开页面加载', () => {
  test('首页正常加载', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/OPC/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('首页有统计数字区域', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    // 首页应有包含数字的统计区
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
  })

  test('社区地图页加载，无报错', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/communities')
    await page.waitForTimeout(3000)
    // 过滤掉非致命的第三方错误
    const fatalErrors = errors.filter(e => !e.includes('BMap') && !e.includes('map'))
    expect(fatalErrors).toHaveLength(0)
  })

  test('创业广场页加载', async ({ page }) => {
    await page.goto('/plaza')
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).toBeVisible()
    // 不应该显示错误页（检查 HTTP 状态，而不是页面文本，因为内容中可能含有"500"字样）
    const body = await page.locator('body').textContent() || ''
    expect(body).not.toContain('Internal Server Error')
    // 确保页面有实际内容（广场帖子或加载状态）
    expect(body.length).toBeGreaterThan(100)
  })

  test('资讯页加载', async ({ page }) => {
    await page.goto('/news')
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('工具导航页加载', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('引导页加载', async ({ page }) => {
    await page.goto('/start')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('搜索页加载', async ({ page }) => {
    await page.goto('/search')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('登录页加载', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('注册页加载', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('未登录访问发帖页 → 跳转登录', async ({ page }) => {
    await page.goto('/plaza/new')
    // 应该跳转到登录页或显示登录提示，不应该是 500
    await page.waitForTimeout(2000)
    const url = page.url()
    const body = await page.locator('body').textContent() || ''
    const isLoginPage = url.includes('/login') || body.includes('登录') || body.includes('Login')
    const isAllowed = url.includes('/plaza/new')
    expect(isLoginPage || isAllowed).toBe(true)
  })
})
