import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: /十字交叉口/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.mode-stage').first()).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(350)
}

async function openNav(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: '功能导航' })
    .getByRole('tab', { name: new RegExp(label) })
    .click()
  await page.waitForTimeout(280)
}

test.describe('Crossdraw v0.5.80 release chips + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell top scheme switcher', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.80/).first()).toBeVisible()
    await expect(page.getByRole('group', { name: '方案切换' })).toBeVisible()
    await expect(page.getByText('方案树')).toHaveCount(0)
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel approach rail', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await expect(page.getByLabel('页面功能').getByText('进口道').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal stack + release chips', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await expect(page.getByText('相位灯态').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.signal-stack-params')).toBeVisible()
    await expect(page.getByText('放行 · 机动车').first()).toBeVisible({ timeout: 8000 })
    const chip = page.locator('.release-chip').first()
    await chip.click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
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
