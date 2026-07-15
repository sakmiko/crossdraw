import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.29', () => {
  test('variable lane checkbox in channel editor', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '渠化' }).click()
    await page.locator('.tree-approach').first().click()
    await page.waitForTimeout(200)

    const details = page.locator('details.details-block').filter({ hasText: '可变车道' }).first()
    await expect(details).toBeVisible({ timeout: 10000 })
    await details.evaluate((el: HTMLDetailsElement) => {
      el.open = true
    })
    await details.locator('.details-body').evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await expect(details.getByText('可变', { exact: true }).first()).toBeVisible()
    await details.locator('label.check-inline input[type="checkbox"]').first().check()
    await page.waitForTimeout(200)
    await expect(details.getByText('车道组').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })
})
