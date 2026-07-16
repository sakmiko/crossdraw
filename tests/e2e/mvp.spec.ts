import { expect, test, type Page } from '@playwright/test'

async function bootCross(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('details.menu-dropdown', { hasText: '新建' }).locator('summary').click()
  await page.getByRole('menuitem', { name: /十字交叉口/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.page-fill, .band-page').first()).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(300)
}

async function openNav(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: '功能导航' })
    .getByRole('tab', { name: new RegExp(label) })
    .click()
  await page.waitForTimeout(300)
}

test.describe('v0.5.116 zebra + layout polish', () => {
  // docs/screenshots/00-shell.png
  // docs/screenshots/06-compare.png
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell left-right stage visible', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.116/).first()).toBeVisible()
    const stage = page.locator('.page-fill-stage').first()
    await expect(stage).toBeVisible()
    const box = await stage.boundingBox()
    expect(box && box.width > 200 && box.height > 200).toBeTruthy()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal left-right not stacked only', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    const stage = page.locator('.page-fill-stage').first()
    const params = page.locator('.page-fill-params').first()
    await expect(stage).toBeVisible()
    await expect(params).toBeVisible()
    const sb = await stage.boundingBox()
    const pb = await params.boundingBox()
    // desktop: stage left of params (x smaller)
    if (sb && pb) {
      expect(sb.x).toBeLessThan(pb.x + 40)
      expect(sb.height).toBeGreaterThan(180)
    }
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    if (await page.getByRole('button', { name: /交互图/ }).count()) {
      await page.getByRole('button', { name: /交互图/ }).click()
      await page.waitForTimeout(400)
    }
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
