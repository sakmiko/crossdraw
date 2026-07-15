import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.42', () => {
  test('analysis workspace after extract', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByText('评价分析').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/图\/表同源|同源校验失败/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: '导出分析拼图' })).toBeVisible()
    await expect(page.getByRole('button', { name: '打开方案比选工作区' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })
})
