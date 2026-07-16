import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: /十字交叉口/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.page-fill, .band-page').first()).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(300)
}

async function openNav(page: Page, label: string) {
  await page.getByRole('navigation', { name: '功能导航' }).getByRole('tab', { name: new RegExp(label) }).click()
  await page.waitForTimeout(300)
}

test.describe('Crossdraw v0.5.85 layout-policy + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.85/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow left-right on desktop', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await expect(page.locator('.app.shell--flow')).toBeVisible()
    const stage = await page.locator('.page-fill-stage').boundingBox()
    const params = await page.locator('.page-fill-params').boundingBox()
    expect(stage && params).toBeTruthy()
    if (stage && params) {
      // desktop: side-by-side — stage left of params (x smaller), similar y
      expect(stage.x).toBeLessThan(params.x)
      expect(Math.abs(stage.y - params.y)).toBeLessThan(80)
    }
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal vertical only', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await expect(page.locator('.app.shell--signal')).toBeVisible()
    const stage = await page.locator('.page-fill-stage').boundingBox()
    const params = await page.locator('.page-fill-params').boundingBox()
    expect(stage && params).toBeTruthy()
    if (stage && params) {
      expect(stage.y).toBeLessThan(params.y)
      expect(Math.abs(stage.width - params.width)).toBeLessThan(80)
    }
    await expect(page.getByText('无信号控制').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis unsignalized', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    await expect(page.getByText('启用无信号模式').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('启用无信号模式').locator('..').locator('input[type=checkbox]').check()
    await page.waitForTimeout(400)
    await expect(page.getByText(/无信号|环形|TWSC|twsc/i).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band maxband tab', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
    await page.getByRole('tab', { name: /MAXBAND/ }).click()
    await expect(page.getByText('MAXBAND 报告').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/相位差|MAXBAND/).first()).toBeVisible()
    await page.getByRole('button', { name: /优化并应用/ }).click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('xsection', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '断面')
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('compare', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '比选')
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
