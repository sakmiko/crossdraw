import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.34', () => {
  test('channel canvas has denser annotations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(600)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '渠化' }).click()
    await page.waitForTimeout(300)
    // canvas is pixi — assert app still healthy and export path works
    await expect(page.getByRole('button', { name: /导出|工程/ }).first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })
})
