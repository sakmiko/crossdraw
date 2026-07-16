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
  await page.waitForTimeout(300)
}

test.describe('Crossdraw v0.5.88 network + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.88/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel five-leg', async ({ page }) => {
    await bootCross(page)
    const neu = page.locator('details.menu-dropdown', { hasText: '新建' })
    await neu.locator('summary').click()
    await neu.locator('button[role=menuitem]', { hasText: '五路' }).click({ force: true })
    await page.waitForTimeout(700)
    await openNav(page, '渠化')
    // five approaches on strip or inspector
    await expect(page.locator('body')).toContainText(/东北|五相位|五路/, { timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band network preview', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
    await page.getByRole('tab', { name: /路网预览/ }).click()
    await expect(page.getByText('路网预览').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/干道路网预览|链式/i).first()).toBeVisible()
    await page.getByRole('button', { name: /高分辨率 SVG/ }).click()
    await page.waitForTimeout(200)
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
