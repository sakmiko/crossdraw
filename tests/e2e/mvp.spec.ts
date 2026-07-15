import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.18', () => {
  test('flow table chart homology', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '流量' }).click()
    await expect(page.getByText('表/图同源').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('流量流向箭头图').first()).toBeVisible()
    await expect(page.getByText('转向流量').first()).toBeVisible()
    // switch display mode
    await page.locator('select').filter({ hasText: '自然流量' }).selectOption('peak').catch(async () => {
      await page.getByLabel('图示数据').selectOption('peak')
    })
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })
  })
})
