import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: /十字交叉口/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.mode-stage').first()).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(400)
}

async function openNav(page: Page, label: string) {
  await page.getByRole('navigation', { name: '功能导航' }).getByRole('tab', { name: new RegExp(label) }).click()
  await page.waitForTimeout(300)
}

test.describe('Crossdraw v0.5.79 mode stages + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell silent save', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.79/).first()).toBeVisible()
    await expect(page.locator('button.topbar-save')).toHaveCount(0)
    await expect(page.getByText('未保存')).toHaveCount(0)
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel mesh center', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await expect(page.getByText('交叉口平面').first()).toBeVisible()
    await expect(page.locator('#canvas-root')).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow center diagram live', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await expect(page.getByText('流量流向图').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.mode-stage-svg').first()).toBeVisible()
    // edit volume in right panel
    const num = page.locator('.right table input[type="number"]').first()
    if (await num.count()) {
      await num.fill('888')
      await page.waitForTimeout(300)
    }
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal center board', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await expect(page.getByText('相位灯态').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.mode-stage-svg').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis plan center', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    await expect(page.getByText('平面评价图').first()).toBeVisible({ timeout: 10000 })
    await page.locator('.mode-stage').getByRole('button', { name: '延误时间' }).click({ force: true })
    await page.locator('.mode-stage').getByRole('button', { name: '排队长度' }).click({ force: true })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('xsection center', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '断面')
    await expect(page.getByText('横断面').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('compare', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '比选')
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
