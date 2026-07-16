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

test.describe('Crossdraw v0.5.65 depth + polish', () => {
  test('shell modes', async ({ page }) => {
    const tablist = await bootCross(page)
    await expect(page.getByText(/Crossdraw v0\.5\.65/).first()).toBeVisible()
    for (const m of ['渠化', '流量', '信号', '断面', '分析', '比选', '绿波']) {
      await expect(tablist.getByRole('tab', { name: m })).toBeVisible()
    }
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel aux road panel', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '渠化')
    await expect(page.getByText('辅路 / 侧辅道').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('辅路 / 侧辅道').first().click()
    await page.getByText('启用辅路').click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow multimodal pro chart', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '流量')
    await expect(page.getByText(/行人|非机动车/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.chart-svg-host, svg.chart-svg--pro').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal ped-only phase', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '信号')
    await expect(page.getByRole('button', { name: '专用行人相位' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '专用行人相位' }).click()
    await expect(page.getByText(/行人相位/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('xsection interactive strip', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '断面')
    await expect(page.getByText(/横断面/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/断面同源|构成编辑/).first()).toBeVisible()
    await expect(page.locator('input[type="range"]').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('analysis report and vissim pack buttons', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '分析')
    await expect(page.getByRole('button', { name: '多页工程报告 PDF' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Vissim 交换包' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band maxband and corridor map', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    await expect(page.getByText('走廊选点示意').first()).toBeVisible({ timeout: 10000 })
    await page.locator('select').filter({ hasText: 'MAXBAND' }).selectOption('maxband-discrete')
    await page.getByRole('button', { name: /优化相位差/ }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('compare workspace', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '比选')
    await expect(page.getByText('方案比选').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '导出并排配时图' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
