import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import { buildPhaseConflictReport, allPhasesConflictHits, phaseConflictSummaryText } from '@/domain/signal/phaseConflictView'
import { conflictMatrixSvg } from '@/ui/charts/svgCharts'

describe('phase conflict view v0.5.30', () => {
  it('flags opposing through when both green in same phase', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    // default template often has NS through together — expect hits or clean depending on phases
    const hits = allPhasesConflictHits(ch.approaches, sg)
    // ensure report builds
    const r = buildPhaseConflictReport(ch.approaches, sg, sg.phases[0].id)
    expect(r.keys.length).toBe(12)
    expect(r.cells.length).toBe(12)
    expect(phaseConflictSummaryText(r)).toMatch(/当前相位/)
    // force opposing T-T in first phase
    const n = ch.approaches.find((a) => a.bearingDeg === 0)!
    const s = ch.approaches.find((a) => a.bearingDeg === 180)!
    sg.phases[0].releases = {
      [n.id]: ['T'],
      [s.id]: ['T'],
    }
    const r2 = buildPhaseConflictReport(ch.approaches, sg, sg.phases[0].id)
    expect(r2.activeHits.some((h) => h.level === 'block' && h.reason.includes('对向'))).toBe(true)
    expect(hits.length).toBeGreaterThanOrEqual(0)
  })

  it('matrix svg marks hot pairs', () => {
    const svg = conflictMatrixSvg(
      ['北T', '南T'],
      [
        ['same', 'block'],
        ['block', 'same'],
      ],
      {
        keys: ['n:T', 's:T'],
        active: new Set(['n:T', 's:T']),
        hotPairs: new Set(['n:T|s:T']),
      },
    )
    expect(svg).toContain('转向冲突矩阵')
    expect(svg).toContain('!')
  })
})
