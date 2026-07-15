import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.7', () => {
  test('channel legend and geometry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: '适应窗口' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/01-channel-dark.png', fullPage: true })

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '渠化' }).click()
    await expect(page.getByText('渠化').first()).toBeVisible()
  })
})
