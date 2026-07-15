import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.15', () => {
  test('band lock UX and analysis integrity badge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByText('锁定').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /优化相位差/ })).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/06-band.png', fullPage: true })

    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByText('图/表同源').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })
  })
})
