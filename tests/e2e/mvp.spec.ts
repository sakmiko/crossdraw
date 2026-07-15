import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.35', () => {
  test('band corridor sidebar and batch optimize', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByRole('listbox', { name: '绿波走廊' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '+ 新建' }).click()
    await page.waitForTimeout(200)
    await expect(page.getByRole('option').nth(1)).toBeVisible()
    await page.getByRole('button', { name: '批量优化全部' }).click()
    await expect(page.getByText(/已批量优化/).first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })
})
