import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.12', () => {
  test('export center opens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    await page.getByRole('button', { name: '导出中心' }).click()
    await expect(page.getByRole('dialog', { name: '导出中心' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: '导出中心' })).toBeVisible()
    await expect(page.getByText('分析报告拼图').first()).toBeVisible()
    await expect(page.getByText('渠化平面图 SVG').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/12-export-center.png', fullPage: true })
    await page.getByRole('button', { name: '关闭' }).click()
  })
})
