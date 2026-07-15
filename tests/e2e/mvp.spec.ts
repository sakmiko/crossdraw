import { expect, test } from '@playwright/test'

test.describe('Crossdraw visual QA', () => {
  test('main path + charts + themes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.getByText('Crossdraw').first()).toBeVisible()
    await page.getByRole('button', { name: '新建十字' }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(800)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await expect(tablist).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: 'docs/screenshots/01-channel-dark.png', fullPage: true })

    await page.getByRole('button', { name: '浅色', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/01b-channel-light.png', fullPage: true })
    await page.getByRole('button', { name: '深色', exact: true }).click()

    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText('转向冲突矩阵')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('搭接相位 Overlap').first()).toBeVisible()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })

    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByText('评价分析')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('综合雷达')).toBeVisible()
    await expect(page.getByText('服务水平').first()).toBeVisible()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'docs/screenshots/04-analysis.png', fullPage: true })

    await tablist.getByRole('tab', { name: '流量' }).click()
    await expect(page.getByText('转向流量')).toBeVisible()
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(250)
    await expect(page.locator('.mobile-nav')).toBeVisible()
    await page.getByRole('button', { name: '参数', exact: true }).click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'docs/screenshots/07-mobile-inspector.png', fullPage: true })
  })
})
