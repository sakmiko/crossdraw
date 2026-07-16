import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: '十字交叉口' }).click()
  await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(300)
}

async function openNav(page: Page, label: string) {
  // left nav uses aria-label from title
  const nav = page.getByRole('navigation', { name: '功能导航' })
  await nav.getByRole('tab', { name: new RegExp(label) }).click()
  await page.waitForTimeout(220)
}

test.describe('Crossdraw v0.5.73 left nav + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell left nav expandable', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.73/).first()).toBeVisible()
    const nav = page.getByRole('navigation', { name: '功能导航' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('tab', { name: /渠化/ })).toBeVisible()
    // collapse to icon
    await page.getByRole('button', { name: /折叠/ }).click()
    await expect(page.locator('.app.nav-collapsed')).toBeVisible()
    await page.getByRole('button', { name: /展开/ }).click()
    await expect(page.locator('.app.nav-expanded')).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel via left nav', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await expect(page.getByRole('heading', { name: '渠化', exact: true })).toBeVisible()
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

  test('band page keeps left nav', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
    await expect(page.getByRole('navigation', { name: '功能导航' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '路口参数表' })).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
    // switch back via left nav
    await openNav(page, '渠化')
    await expect(page.locator('#canvas-root')).toBeVisible()
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
