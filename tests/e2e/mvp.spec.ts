import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.5', () => {
  test('timing compare and vc chips', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByRole('button', { name: '多方法比选' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '多方法比选' }).click()
    await expect(page.getByText('配时方法比选').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('配时方法比选图').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })

    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.locator('.vc-chip').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })
})
