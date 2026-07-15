import { expect, test } from '@playwright/test'

test('E2E-MVP-001 main path', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Crossdraw').first()).toBeVisible()
  await page.getByRole('button', { name: '新建十字' }).click()
  await expect(page.locator('#canvas-root')).toBeVisible()

  const lane = page.getByLabel('进口车道数')
  if (await lane.count()) {
    await lane.fill('4')
  }

  // mode tabs are in the right panel segmented control
  await page.locator('.mode-tabs').getByRole('button', { name: '流量', exact: true }).click()
  await page.locator('.mode-tabs').getByRole('button', { name: '信号', exact: true }).click()
  await page.locator('.mode-tabs').getByRole('button', { name: '分析', exact: true }).click()
  await expect(page.getByText('评价分析')).toBeVisible()
  await page.locator('.mode-tabs').getByRole('button', { name: '断面', exact: true }).click()
  await expect(page.getByText('横断面')).toBeVisible()

  await expect(page.getByRole('button', { name: 'PNG' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'SVG' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'DXF' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
  await expect(page.getByRole('button', { name: /命令/ })).toBeVisible()
})
