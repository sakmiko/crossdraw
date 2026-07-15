import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.23', () => {
  test('channel legend and analysis LOS legend', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(500)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByText('服务水平').or(page.getByText('HCM')).first()).toBeVisible({
      timeout: 10000,
    })
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })

    await tablist.getByRole('tab', { name: '渠化' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })
})
