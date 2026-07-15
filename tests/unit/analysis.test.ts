import { describe, expect, it } from 'vitest'
import { analyzeIntersection, createCrossTemplate, optimizeBandClassic, websterTiming } from '@/domain'

describe('analysis', () => {
  it('produces los', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = analyzeIntersection(ch.approaches, fl, sg)
    expect(r.lanes.length).toBeGreaterThan(0)
    expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(r.losFinal)
  })

  it('webster returns cycle', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = websterTiming(ch.approaches, fl, sg, { targetVc: 0.85, startLoss: 3 })
    expect(r.cycleSec).toBeGreaterThanOrEqual(40)
    expect(r.phaseGreens.length).toBe(sg.phases.length)
  })

  it('band classic', () => {
    const r = optimizeBandClassic(
      [
        { id: '1', name: '1', distanceM: 0, greenRatio: 0.5, offsetSec: 0 },
        { id: '2', name: '2', distanceM: 500, greenRatio: 0.45, offsetSec: 0 },
        { id: '3', name: '3', distanceM: 1000, greenRatio: 0.5, offsetSec: 0 },
      ],
      90,
      36,
    )
    expect(r.bandwidthRatio).toBeGreaterThan(0)
  })
})
