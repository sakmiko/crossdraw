import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.30', () => {
  test('conflict matrix and phase badges', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText('转向冲突').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/相位相悖|冲突警告|无相悖/).first()).toBeVisible()
    // phase switch buttons exist under chart
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })
})
