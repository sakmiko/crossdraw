import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.26', () => {
  test('widen panel params', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '渠化' }).click()
    await page.locator('.tree-approach').first().click()
    await page.waitForTimeout(200)

    const details = page.locator('details.details-block').filter({ hasText: '进口/出口展宽' }).first()
    await expect(details).toBeVisible({ timeout: 10000 })
    await details.evaluate((el: HTMLDetailsElement) => {
      el.open = true
    })
    await details.locator('.details-body').evaluate((el) => el.scrollIntoView({ block: 'center' }))

    await expect(details.getByText('展宽车道数', { exact: true })).toBeVisible({ timeout: 5000 })
    await expect(details.getByText('渐变段长 (m)', { exact: true })).toBeVisible()
    await expect(details.getByText(/进口加宽/)).toBeVisible()

    const count = details.locator('label').filter({ hasText: /^展宽车道数$/ }).locator('input')
    await count.fill('2')
    await page.waitForTimeout(250)
    await expect(details.getByText(/7\.0/)).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })
})
