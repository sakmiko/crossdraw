import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.6', () => {
  test('band kpi and export button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByText('带宽比').first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '优化相位差' }).click()
    await page.waitForTimeout(400)
    await expect(page.getByText('上行带宽').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '导出时距图/简报' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/06-band.png', fullPage: true })
  })
})
