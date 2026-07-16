import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: /十字交叉口/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.page-fill, .mode-stage').first()).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(350)
}

async function openNav(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: '功能导航' })
    .getByRole('tab', { name: new RegExp(label) })
    .click()
  await page.waitForTimeout(280)
}

test.describe('Crossdraw v0.5.82 auto-timing + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.82/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal auto timing pack', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await expect(page.getByText('自动配时').first()).toBeVisible({ timeout: 10000 })
    // open details if needed
    const gen = page.getByRole('button', { name: '生成方案' })
    await gen.click({ force: true })
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: '计算Y值' }).click({ force: true })
    await page.waitForTimeout(200)
    await expect(page.getByText(/Y\s*=/).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: '自动配时', exact: true }).click({ force: true })
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis export data', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    await expect(page.getByRole('button', { name: '导出数据' }).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
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
