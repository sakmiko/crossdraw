import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.25', () => {
  test('right-turn and safety island controls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    // select first approach in tree if needed
    await page.locator('.tree-approach').first().click().catch(() => {})
    await page.waitForTimeout(200)

    await expect(page.getByText('右转渠化 / 安全岛').first()).toBeVisible({ timeout: 10000 })
    await page.getByText('右转渠化 / 安全岛').first().click()
    await expect(page.getByText('行人安全岛').first()).toBeVisible()
    await expect(page.getByText('安全岛半径').or(page.getByText('渠化岛宽')).first()).toBeVisible()

    // tweak radius
    const radius = page.locator('label').filter({ hasText: '右转半径' }).locator('input')
    await radius.fill('18')
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/01-channel.png', fullPage: true })
  })
})
