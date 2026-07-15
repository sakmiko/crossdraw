import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.16', () => {
  test('signal table-chart alignment badge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText(/配时闭合|未闭合/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('信号配时图').first()).toBeVisible()
    await expect(page.getByText('表图对齐').or(page.getByText('相位环栏')).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })
  })
})
