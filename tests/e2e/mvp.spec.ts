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

test.describe('Crossdraw v0.5.66 depth + polish', () => {
  // modes covered: 渠化 流量 信号 分析 绿波 比选 断面
  test('shell version', async ({ page }) => {
    const tablist = await bootCross(page)
    await expect(page.getByText(/Crossdraw v0\.5\.66/).first()).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '信号' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('roundabout template geometry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '环形', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('signal ped ring after exclusive phase', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '信号')
    await page.getByRole('button', { name: '专用行人相位' }).click()
    await expect(page.getByText('行人过街环图').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/专用行人相位|Walk/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('export center lists new packs', async ({ page }) => {
    const tablist = await bootCross(page)
    await page.getByRole('button', { name: '导出中心' }).click()
    await expect(page.getByText('Vissim 开放交换包').or(page.getByText('多页工程报告')).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('行人过街环图').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('flow multimodal still professional', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '流量')
    await expect(page.getByText(/行人|非机动车/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('band corridor map', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    await expect(page.getByText('走廊选点示意').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('xsection interactive', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '断面')
    await expect(page.getByText(/横断面/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('compare board', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '比选')
    await expect(page.getByText('方案比选').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
