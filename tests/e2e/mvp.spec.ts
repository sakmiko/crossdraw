import { expect, test } from '@playwright/test'

test.describe('Crossdraw v0.5 professional', () => {
  test('templates timing diagrams export path', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.getByText('Crossdraw').first()).toBeVisible()

    await page.getByRole('button', { name: '十字', exact: true }).click()
    await expect(page.locator('#canvas-root')).toBeVisible({ timeout: 20000 })
    await page.waitForTimeout(600)

    await page.getByRole('button', { name: 'Y型', exact: true }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'docs/screenshots/09-y-junction.png', fullPage: true })

    await page.getByRole('button', { name: '环形', exact: true }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'docs/screenshots/10-roundabout.png', fullPage: true })

    await page.getByRole('button', { name: '十字', exact: true }).click()
    await page.waitForTimeout(400)

    const tablist = page.getByRole('tablist', { name: '编辑模式' })
    await tablist.getByRole('tab', { name: '流量' }).click()
    await expect(page.getByText('流量流向箭头图')).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/02-flow.png', fullPage: true })

    await tablist.getByRole('tab', { name: '信号' }).click()
    await expect(page.getByText('信号配时图')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('管控 / 放行图')).toBeVisible()
    await page.getByRole('button', { name: 'Webster 自动配时' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'docs/screenshots/03-signal.png', fullPage: true })

    await tablist.getByRole('tab', { name: '绿波' }).click()
    await expect(page.getByText('绿波时距图')).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'docs/screenshots/06-band.png', fullPage: true })

    await tablist.getByRole('tab', { name: '分析' }).click()
    await expect(page.getByRole('button', { name: '导出专业图件包' })).toBeVisible()
  })
})
