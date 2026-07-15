import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.19', () => {
  test('mode hierarchy and export integrity strip', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    await expect(page.locator('.mode-hierarchy')).toBeVisible()
    await expect(page.getByText('层次渐进').first()).toBeVisible()

    await page.getByRole('button', { name: '导出中心' }).click()
    await expect(page.getByRole('dialog', { name: '导出中心' })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.export-integrity').first()).toBeVisible()
    await expect(page.getByText(/同源校验|配时|流量|分析/).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/12-export-center.png', fullPage: true })
  })
})
