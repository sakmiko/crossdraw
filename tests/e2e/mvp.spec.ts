import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  // templates are under 新建 menu in v0.5.70
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: '十字交叉口' }).click()
  await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(350)
  return page.getByRole('tablist', { name: '编辑模式' })
}

async function openMode(page: Page, tablist: ReturnType<Page['getByRole']>, name: string) {
  await tablist.getByRole('tab', { name }).click()
  await page.waitForTimeout(200)
}

test.describe('Crossdraw v0.5.70 UI declutter + polish', () => {
  // modes covered: 渠化 流量 信号 分析 绿波 比选 断面
  test('shell topbar menus', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/Crossdraw v0\.5\.70|v0\.5\.70/).first()).toBeVisible()
    await expect(page.locator('details.menu-dropdown summary', { hasText: '新建' })).toBeVisible()
    await expect(page.locator('details.menu-dropdown summary', { hasText: '文件' })).toBeVisible()
    await expect(page.locator('details.menu-dropdown summary', { hasText: '导出' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '渠化')
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '流量')
    await expect(page.getByText(/行人|非机/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal dual-ring sections', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '信号')
    await expect(page.getByText('相位表').first()).toBeVisible({ timeout: 10000 })
    await page.locator('label.check-inline', { hasText: '双环栏' }).locator('input[type="checkbox"]').check()
    await page.waitForTimeout(300)
    await expect(page.getByText('双屏障').or(page.getByRole('button', { name: '双屏障' })).first()).toBeVisible({
      timeout: 10000,
    })
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis collapsed exports', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '分析')
    await expect(page.getByText('评价分析').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('导出与报告').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    // corridor title is shorter now (name only); still has speed
    await expect(page.getByText(/km\/h|走廊|绿波/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
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
