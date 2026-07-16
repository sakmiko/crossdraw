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
  await page
    .getByRole('navigation', { name: '功能导航' })
    .getByRole('tab', { name: new RegExp(label) })
    .click()
  await page.waitForTimeout(350)
}

test.describe('v0.5.131 design-system + interactive signal polish', () => {
  // docs/screenshots/00-shell.png
  // docs/screenshots/06-compare.png
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell design tokens', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.131/).first()).toBeVisible()
    await openNav(page, '渠化')
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
  test('signal interactive board', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await expect(page.locator('.interactive-signal-board').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/拖绿条/).first()).toBeVisible()
    // layout: stage left of params on desktop
    const stage = page.locator('.page-fill-stage').first()
    const params = page.locator('.page-fill-params').first()
    const sb = await stage.boundingBox()
    const pb = await params.boundingBox()
    expect(sb && pb && sb.x < pb.x).toBeTruthy()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })
  test('analysis', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
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
