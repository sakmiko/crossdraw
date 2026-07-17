import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import {
  computeSchemeY,
  generateProtectedPhases,
  clearPhaseGreens,
  runAutoTimingPack,
  autoTimingMarkdown,
} from '@/domain/signal/autoTimingPack'
import { roadgeeSignalBoardSvg } from '@/ui/charts/roadgeeSignalBoard'
import { buildSignalTimingAlignment } from '@/domain'

describe('v0.5.82 deep auto-timing pack', () => {
  it('computes Y, generates/clears phases, auto-times with design VC', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg0 = fl.signalSchemes[0]
    const y0 = computeSchemeY(ch.approaches, fl, sg0)
    expect(y0.Y).toBeGreaterThan(0)
    expect(y0.phaseRows.length).toBeGreaterThan(0)

    const gen = generateProtectedPhases(ch.approaches, sg0)
    expect(gen.phases.length).toBe(ch.approaches.length)
    expect(gen.yellowDefault).toBe(3)
    const al = buildSignalTimingAlignment(gen)
    expect(al.cycleSec).toBe(gen.cycleSec)

    const cleared = clearPhaseGreens(gen, 8)
    for (const ph of cleared.phases.filter((x) => !x.isOverlap)) {
      expect(ph.greenSec).toBe(8)
    }

    const pack = runAutoTimingPack(ch.approaches, fl, sg0, {
      targetVc: 0.9,
      startLossSec: 3,
      designPhf: fl.phf,
      designCycleSec: 90,
      lockCycle: false,
      method: 'webster',
    })
    expect(pack.cycleSec).toBeGreaterThanOrEqual(40)
    expect(pack.appliedPhases.length).toBeGreaterThan(0)
    expect(pack.yReport.Y).toBeGreaterThan(0)
    const md = autoTimingMarkdown(p.name, pack)
    expect(md).toContain('自动配时报告')
    expect(md).toContain('Y =')

    // board changes with new greens
    const b1 = roadgeeSignalBoardSvg(ch.approaches, sg0)
    const sg1 = { ...sg0, phases: pack.appliedPhases, cycleSec: pack.cycleSec }
    const b2 = roadgeeSignalBoardSvg(ch.approaches, sg1)
    expect(b2).not.toEqual(b1)
  })

  it('UI wires generate/clear/Y/design params', () => {
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('计算Y值')
    expect(sw).toContain('生成方案')
    expect(sw).toContain('清空方案')
    expect(sw).toContain('设计目标VC')
    expect(sw).toContain('启动损失')
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('onGenerateScheme')
    expect(app).toContain('runAutoTimingPack')
    expect(app).toContain('replaceSignalScheme')
  })
})
