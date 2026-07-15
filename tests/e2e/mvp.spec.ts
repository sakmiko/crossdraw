import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.9', () => {
  test('compare workspace mode', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '比选' }).click()
    await expect(page.getByText('方案比选').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '导出比选 CSV' })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/11-compare.png', fullPage: true })

    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByRole('button', { name: '打开方案比选工作区' })).toBeVisible({ timeout: 10000 })
  })
})
