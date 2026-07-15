import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.39', () => {
  test('flow workspace after extract', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '流量' }).click()
    await expect(page.getByText(/表\/图同源|表\/图不一致/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('columnheader', { name: '高峰Σ' })).toBeVisible()
    await expect(page.locator('select').filter({ hasText: '自然流量' }).first()).toBeAttached()
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })
})
