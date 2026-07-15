import { describe, expect, it } from 'vitest'
import { createCrossTemplate, optimizeCorridor, analyzeIntersection } from '@/domain'
import { exportVissimCsvBundle } from '@/io/vissimCsv'

describe('band corridor', () => {
  it('optimizes editable nodes', () => {
    const p = createCrossTemplate()
    const r = optimizeCorridor(p.bandCorridor)
    expect(r.offsets.length).toBe(p.bandCorridor.nodes.length)
    expect(r.bandwidthRatio).toBeGreaterThanOrEqual(0)
  })
})

describe('red right turn analysis', () => {
  it('raises right-turn capacity when redRightTurn enabled', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const ap = ch.approaches[0]
    ap.redRightTurn = false
    const base = analyzeIntersection(ch.approaches, fl, sg)
    const baseR = base.lanes.find((l) => l.approachId === ap.id && l.movement === 'R')
    ap.redRightTurn = true
    ap.redRightTurnRatio = 0.4
    const alt = analyzeIntersection(ch.approaches, fl, sg)
    const altR = alt.lanes.find((l) => l.approachId === ap.id && l.movement === 'R')
    expect(altR!.capacity).toBeGreaterThanOrEqual(baseR!.capacity)
  })
})

describe('vissim csv', () => {
  it('exports four tables', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const b = exportVissimCsvBundle(ch.approaches, fl, fl.signalSchemes[0])
    expect(b.links).toContain('link_id')
    expect(b.routes).toContain('route_id')
    expect(b.volumes).toContain('approach')
    expect(b.signal).toContain('phase_id')
  })
})
