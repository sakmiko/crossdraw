import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: '十字', exact: true }).click()
  await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(350)
  return page.getByRole('tablist', { name: '编辑模式' })
}

async function openMode(page: Page, tablist: ReturnType<Page['getByRole']>, name: string) {
  await tablist.getByRole('tab', { name }).click()
  await page.waitForTimeout(200)
}

test.describe('Crossdraw v0.5.68 multi-barrier + polish', () => {
  // modes covered: 渠化 流量 信号 分析 绿波 比选 断面
  test('shell version', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/Crossdraw v0\.5\.68/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('dual-ring multi-barrier controls', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '信号')
    await page.locator('label.check-inline', { hasText: '双环栏' }).locator('input[type="checkbox"]').check()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: '双屏障分配' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '双屏障分配' }).click()
    await page.waitForTimeout(200)
    await expect(page.getByRole('button', { name: '平衡双环' })).toBeVisible()
    await expect(page.getByRole('button', { name: '闭合周期 C' })).toBeVisible()
    await page.getByRole('button', { name: '闭合周期 C' }).click()
    await page.waitForTimeout(200)
    await expect(page.getByText('双环栏图').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('Y template corner CAD', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Y型', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '流量')
    await expect(page.getByText(/行人|非机动车/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('analysis', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '分析')
    await expect(page.getByText('评价分析').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    await expect(page.getByText('走廊选点示意').first()).toBeVisible({ timeout: 10000 })
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
