import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.14', () => {
  test('band timespace accurate labels', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByText('交互时距图').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('上行带宽').or(page.getByText('上行 b↑')).first()).toBeVisible()
    await page.getByRole('button', { name: /优化/ }).first().click().catch(() => {})
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/06-band.png', fullPage: true })
  })
})
