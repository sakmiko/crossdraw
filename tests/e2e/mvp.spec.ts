import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5.4 timing & band', () => {
  test('timing methods and band segments', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(500)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText('配时方法')).toBeVisible({ timeout: 10000 })
    await page.locator('select').filter({ hasText: 'Webster' }).selectOption('fixed-cycle')
    await page.getByRole('button', { name: '一键优化配时' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('配时优化说明').first()).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })

    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByText('路段距离').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('交互时距图').first()).toBeVisible()
    await page.locator('.card select').last().selectOption('one-way')
    await page.getByRole('button', { name: '优化相位差' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/06-band.png', fullPage: true })
  })
})
