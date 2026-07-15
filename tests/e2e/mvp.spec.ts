import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.10', () => {
  test('scheme compare timing strip', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    // create a second signal scheme via toolbar if available
    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '比选' }).click()
    await expect(page.getByText('并排配时图').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '导出并排配时图' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/11-compare.png', fullPage: true })
  })
})
