import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, makePedestrianOnlyPhase } from '@/domain'
import {
  buildLostTimeReport,
  lostTimeBoardSvg,
  lostTimeMarkdown,
  lostTimeCsv,
} from '@/ui/charts/lostTimeBoard'
import {
  collectPedOptRows,
  pedTimingOptBoardSvg,
  pedTimingOptMarkdown,
  applyPedTimingToSignal,
} from '@/ui/charts/pedTimingOptBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.107 lost time L + ped Walk/FDW opt', () => {
  it('builds lost time board and curve', () => {
    const p = createCrossTemplate()
    const sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    const rep = buildLostTimeReport(sg)
    expect(rep.L).toBeGreaterThan(0)
    expect(rep.curve.length).toBeGreaterThan(5)
    const svg = lostTimeBoardSvg(sg)
    expect(svg).toContain('损失时间 L')
    expect(lostTimeMarkdown(p.name, sg)).toContain('Webster')
    expect(lostTimeCsv(sg)).toContain('Y,C_opt')
  })

  it('ped timing opt rows and apply', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    let sg = ch.flowSchemes[0].signalSchemes[0]
    const ped = makePedestrianOnlyPhase(
      'ped-x',
      '行人测',
      ch.approaches.map((a) => a.id),
      12,
    )
    sg = { ...sg, phases: [...sg.phases, ped] }
    const rows = collectPedOptRows(sg, ch.approaches)
    expect(rows.length).toBeGreaterThan(0)
    expect(pedTimingOptBoardSvg(sg, ch.approaches)).toContain('Walk/FDW')
    const next = applyPedTimingToSignal(sg, ch.approaches)
    const ped2 = next.phases.find((x) => x.id === 'ped-x')
    expect(ped2?.pedWalkSec || ped2?.greenSec).toBeTruthy()
    expect(pedTimingOptMarkdown(p.name, sg, ch.approaches)).toContain('行人')
  })

  it('export + workspaces', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('lost-time-board-svg')
    expect(ids).toContain('ped-timing-opt-svg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('损失时间 L')
    expect(sw).toContain('应用 Walk/FDW')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('lostTimeBoardSvg')
  })
})
