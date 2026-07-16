import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: '十字交叉口' }).click()
  await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(350)
  return page.getByRole('tablist', { name: '编辑模式' })
}

async function openMode(page: Page, tablist: ReturnType<Page['getByRole']>, name: string) {
  await tablist.getByRole('tab', { name }).click()
  await page.waitForTimeout(250)
}

test.describe('Crossdraw v0.5.71 geometry + band page + polish', () => {
  // modes covered: 渠化 流量 信号 分析 绿波 比选 断面
  test('shell', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.71/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel Y junction geometry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
    await page.getByRole('menuitem', { name: 'Y 型' }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '流量')
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '信号')
    await expect(page.getByText('相位表').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '分析')
    await expect(page.getByText('评价分析').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band dedicated page', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    // full page — back button and tabs
    await expect(page.getByRole('button', { name: /交叉口设计/ })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('tab', { name: '时距图' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '走廊图' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '节点表' })).toBeVisible()
    await page.getByRole('tab', { name: '走廊图' }).click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
    // return
    await page.getByRole('button', { name: /交叉口设计/ }).click()
    await page.waitForTimeout(200)
    await expect(page.getByRole('tablist', { name: '编辑模式' })).toBeVisible()
  })

  test('xsection', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '断面')
    await expect(page.getByText(/横断面/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('compare', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '比选')
    await expect(page.getByText('方案比选').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
