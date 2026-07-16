import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: '十字交叉口' }).click()
  await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(300)
  return page.getByRole('tablist', { name: '编辑模式' })
}

async function openMode(page: Page, tablist: ReturnType<Page['getByRole']>, name: string) {
  await tablist.getByRole('tab', { name }).click()
  await page.waitForTimeout(220)
}

test.describe('Crossdraw v0.5.72 sidewalk + band table + no-geo + polish', () => {
  // modes: 渠化 流量 信号 分析 绿波 比选 断面
  test('shell no basemap geo fields', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.72/).first()).toBeVisible()
    await expect(page.getByText('纬度')).toHaveCount(0)
    await expect(page.getByText('经度')).toHaveCount(0)
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel Y sidewalk', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
    await page.getByRole('menuitem', { name: 'Y 型' }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(500)
    await expect(page.getByText('显示 OSM')).toHaveCount(0)
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
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '分析')
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band table default no lat lon', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    await expect(page.getByRole('tab', { name: '路口参数表' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('带宽比').first()).toBeVisible()
    await expect(page.getByText('纬度')).toHaveCount(0)
    await expect(page.getByText('经度')).toHaveCount(0)
    // table headers
    await expect(page.getByRole('columnheader', { name: '相位差 s' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'λ 绿信比' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('xsection', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '断面')
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('compare', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '比选')
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
