import { expect, type Page, test } from '@playwright/test'

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

test.describe('Crossdraw v0.5.44 smoke suite', () => {
  test('shell: canvas tree and mode rail', async ({ page }) => {
    const tablist = await bootCross(page)
    await expect(page.getByText('Crossdraw v0.5.44').or(page.getByText(/Crossdraw v0\./)).first()).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '渠化' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '流量' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '信号' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '分析' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '绿波' })).toBeVisible()
    await expect(tablist.getByRole('tab', { name: '比选' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel: basemap and approach editor', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '渠化')
    await expect(page.getByText('地图底图').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/渠化 ·/).first()).toBeVisible()
    await expect(page.getByText('进口/出口展宽').first()).toBeVisible()
    await expect(page.getByText('右转渠化 / 安全岛').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow: table chart homology', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '流量')
    await expect(page.getByText(/表\/图同源|表\/图不一致/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('columnheader', { name: '高峰Σ' })).toBeVisible()
    await expect(page.locator('select').filter({ hasText: '自然流量' }).first()).toBeAttached()
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal: timing conflict and ped controls', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '信号')
    await expect(page.getByText(/配时闭合|配时/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '行人' }).first()).toBeVisible()
    await expect(page.getByText('冲突点示意图').or(page.getByText('冲突')).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis: integrity and exports', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '分析')
    await expect(page.getByText('评价分析').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/图\/表同源|同源校验失败/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: '导出分析拼图' })).toBeVisible()
    await expect(page.getByRole('button', { name: '打开方案比选工作区' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band: corridor sidebar and batch optimize', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '绿波')
    await expect(page.getByRole('listbox', { name: '绿波走廊' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('干道绿波').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '批量优化全部' })).toBeVisible()
    await page.getByRole('button', { name: '+ 新建' }).click()
    await page.waitForTimeout(150)
    await expect(page.getByRole('option').nth(1)).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('compare: scheme board opens', async ({ page }) => {
    const tablist = await bootCross(page)
    await openMode(page, tablist, '比选')
    await expect(page.getByText('方案比选').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '导出并排配时图' })).toBeVisible()
    await expect(page.getByRole('button', { name: '打开' }).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
