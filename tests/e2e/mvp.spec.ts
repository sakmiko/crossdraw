import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.8', () => {
  test('analysis board export button and flow chart', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '流量' }).click()
    await expect(page.getByText('流量流向箭头图').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })

    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByRole('button', { name: '导出分析拼图' })).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })
})
