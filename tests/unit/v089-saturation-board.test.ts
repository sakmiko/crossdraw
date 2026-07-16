import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import {
  computeSaturationKpi,
  previewOptimize,
  saturationKpiMarkdown,
} from '@/domain/signal/saturationKpi'
import { signalControlBoardSvg } from '@/ui/charts/signalControlBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.89 saturation KPI + control board', () => {
  it('computes KPI and board from scheme', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const k = computeSaturationKpi(ch.approaches, fl, sg)
    expect(k.cycleSec).toBe(sg.cycleSec)
    expect(k.Y).toBeGreaterThan(0)
    expect(k.avgVc).toBeGreaterThanOrEqual(0)
    expect(k.los).toMatch(/^[A-F]$/)
    const svg = signalControlBoardSvg(ch.approaches, sg, k, { width: 900 })
    expect(svg).toContain('信号管控与饱和度看板')
    expect(svg).toContain('相位放行管控图')
    expect(svg).toContain('配时条')
    expect(svg).not.toContain('试用版')
    const prev = previewOptimize(ch.approaches, fl, sg, { method: 'webster' })
    expect(prev.after.cycleSec).toBeGreaterThan(0)
    expect(prev.appliedPhases.length).toBeGreaterThan(0)
    expect(saturationKpiMarkdown(p.name, k)).toContain('饱和度')
  })

  it('UI and export wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('signal-control-board')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('一键优化配时')
    expect(sw).toContain('饱和度 / 延误 KPI')
    expect(sw).toContain('signalControlBoardSvg')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('signal-control-board')
  })
})
