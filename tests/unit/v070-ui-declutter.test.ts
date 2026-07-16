import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, enableDualRing } from '@/domain'
import { dualRingDiagramSvg } from '@/ui/charts/dualRingDiagram'
import { corridorMapSvg } from '@/ui/charts/corridorMap'

describe('v0.5.70 UI declutter', () => {
  it('e2e suite title and modes present', () => {
    const p = resolve(__dirname, '../e2e/mvp.spec.ts')
    const t = readFileSync(p, 'utf8')
    expect(t).toContain('median + flow-echarts polish')
    for (const mode of ['流量', '信号', '绿波', '比选', '断面']) {
      expect(t).toContain(mode)
    }
    expect(t).toContain('docs/screenshots/00-shell.png')
    expect(t).toContain('docs/screenshots/06-compare.png')
  })

  it('App topbar uses dropdown menus not flat template buttons', () => {
    const p = resolve(__dirname, '../../src/ui/layout/App.tsx')
    const t = readFileSync(p, 'utf8')
    expect(t).toContain('menu-dropdown')
    expect(t).toContain('新建')
    expect(t).toContain('十字交叉口')
    // no flat row of template buttons in topbar
    expect(t).not.toMatch(/loadTemplate\('cross'\)\}>十字<\//)
  })

  it('signal workspace is flat', () => {
    const p = resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx')
    const t = readFileSync(p, 'utf8')
    expect(t).not.toMatch(/<details\\b/)
    expect(t).toContain('相位表')
    expect(t).toContain('相位操作 / 配时优化')
  })

  it('charts drop long bilingual titles and lat/lon under nodes', () => {
    const p = createCrossTemplate()
    const sg = enableDualRing(p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0], true)
    const dual = dualRingDiagramSvg(sg)
    expect(dual).toContain('双环栏')
    expect(dual).not.toContain('Dual-Ring Barrier')
    expect(dual).not.toContain('阶段宽=max')

    const map = corridorMapSvg(p.bandCorridor)
    expect(map).not.toContain('走廊选点示意 ·')
    expect(map).not.toContain('WGS84')
    expect(map).not.toMatch(/\d+\.\d{4}, \d+\.\d{4}/)
  })
})
