import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.38', () => {
  test('ped-vehicle badge after enabling ped+right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    // enable ped on first approach of first phase
    await page.getByRole('button', { name: '行人' }).first().click()
    // enable R on same block - first R button in first phase card
    const phase = page.locator('.phase').first()
    await phase.getByRole('button', { name: 'R', exact: true }).first().click()
    await page.waitForTimeout(200)
    await expect(page.getByText(/人车/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })
})
