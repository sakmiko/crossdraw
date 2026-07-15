import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.20', () => {
  test('scheme tree hierarchy and light theme charts', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    await expect(page.locator('.scheme-tree')).toBeVisible()
    await expect(page.locator('.tree-channel').first()).toBeVisible()
    await expect(page.getByText('流量 ·').first()).toBeVisible()

    await page.getByRole('button', { name: '浅色' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText('信号配时图').first()).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/13-light-signal.png', fullPage: true })
  })
})
