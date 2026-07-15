import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.36', () => {
  test('conflict point diagram on signal page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText('冲突点示意图').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '导出冲突点图' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })
})
