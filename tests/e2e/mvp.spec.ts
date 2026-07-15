import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.33', () => {
  test('analysis table filters and sort headers', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByText('显示').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /v\/c/ }).first()).toBeVisible()
    await page.getByRole('button', { name: /v\/c/ }).first().click()
    await expect(page.getByRole('button', { name: '导出 CSV（当前筛选）' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })
})
