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
  await page.waitForTimeout(350)
}

async function assertTwoPane(page: Page, mode: 'cols' | 'rows') {
  const body = page.locator('.page-fill-body').first()
  await expect(body).toBeVisible()
  const box = await body.boundingBox()
  expect(box).toBeTruthy()
  const stage = page.locator('.page-fill-stage').first()
  const params = page.locator('.page-fill-params').first()
  const sb = await stage.boundingBox()
  const pb = await params.boundingBox()
  expect(sb && pb).toBeTruthy()
  if (!sb || !pb) return
  if (mode === 'cols') {
    // stage left of params
    expect(sb.x + sb.width).toBeLessThanOrEqual(pb.x + 8)
  } else {
    // stage above params
    expect(sb.y + sb.height).toBeLessThanOrEqual(pb.y + 12)
  }
}

test.describe('Crossdraw v0.5.100 layout + polish', () => {
  // 渠化 流量 信号 分析 绿波 比选 断面
  test('shell desktop', async ({ page }) => {
    await bootCross(page)
    await expect(page.getByText(/v0\.5\.100/).first()).toBeVisible()
    await expect(page.locator('.left-nav')).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/00-shell.png', fullPage: true })
  })

  test('channel left-right', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '渠化')
    await expect(page.locator('.page-fill-params details')).toHaveCount(0)
    await assertTwoPane(page, 'cols')
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })

  test('flow left-right', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '流量')
    await assertTwoPane(page, 'cols')
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })

  test('signal vertical', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '信号')
    await expect(page.locator('.page-fill-params details')).toHaveCount(0)
    await assertTwoPane(page, 'rows')
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })

  test('analysis + narrow stack', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '分析')
    await assertTwoPane(page, 'cols')
    await page.setViewportSize({ width: 900, height: 800 })
    await page.waitForTimeout(300)
    await assertTwoPane(page, 'rows')
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })

  test('band', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '绿波')
    await expect(page.locator('.band-page')).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })

  test('xsection', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '断面')
    await assertTwoPane(page, 'cols')
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })

  test('compare', async ({ page }) => {
    await bootCross(page)
    await openNav(page, '比选')
    await assertTwoPane(page, 'cols')
    await page.screenshot({ path: 'docs/screenshots/06-compare.png', fullPage: true })
  })
})
