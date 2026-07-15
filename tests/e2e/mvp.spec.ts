import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.25', () => {
  test('right-turn safety island panel and radius', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '渠化' }).click()
    await page.locator('.tree-approach').first().click()
    await page.waitForTimeout(250)

    // open details if closed
    const details = page.locator('details.details-block').filter({ hasText: '右转渠化 / 安全岛' }).first()
    await expect(details).toBeVisible({ timeout: 10000 })
    await details.evaluate((el: HTMLDetailsElement) => {
      el.open = true
    })
    await page.waitForTimeout(150)

    // force-visible assertion via attached + count (panel may be below fold)
    await details.locator('.details-body').evaluate((el) => {
      el.scrollIntoView({ block: 'center' })
    })
    await expect(details.locator('text=渠化岛宽')).toBeVisible({ timeout: 5000 })
    await expect(details.locator('text=行人安全岛')).toBeVisible()

    const radius = page.getByRole('spinbutton', { name: '右转半径' })
    await radius.fill('18')
    await expect(radius).toHaveValue('18')
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })
})
