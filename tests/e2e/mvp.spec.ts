import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.41', () => {
  test('band workspace after extract', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByRole('listbox', { name: '绿波走廊' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('干道绿波').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '批量优化全部' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })
})
