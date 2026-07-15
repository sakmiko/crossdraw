import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.24', () => {
  test('print composition preview opens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    await page.getByRole('button', { name: '打印拼版' }).click()
    await expect(page.getByRole('dialog', { name: '打印拼版预览' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('导出拼版 SVG')).toBeVisible()
    await expect(page.locator('.print-sheet-host svg').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/14-print-a4.png', fullPage: true })
  })
})
