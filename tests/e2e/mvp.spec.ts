import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.27', () => {
  test('multi corridor switcher', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByText('当前走廊').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: '+ 新建走廊' })).toBeVisible()
    await page.getByRole('button', { name: '+ 新建走廊' }).click()
    await page.waitForTimeout(200)
    await expect(page.getByText(/条走廊/).first()).toBeVisible()
    // select should have 2 options
    const sel = page.locator('.band-corridor-bar select').first()
    await expect(sel.locator('option')).toHaveCount(2)
    await page.screenshot({ path: 'docs/screenshots/05-band.png', fullPage: true })
  })
})
