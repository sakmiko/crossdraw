import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.11', () => {
  test('cross section professional diagram', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '断面' }).click()
    await expect(page.getByText('标准横断面').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '导出标准断面图' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/05-xsection.png', fullPage: true })
  })
})
