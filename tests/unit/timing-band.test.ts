import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import { optimizeSignalTiming } from '@/domain/analysis/timing'
import { optimizeCorridor, setSegmentLength, corridorSegments } from '@/domain/analysis/corridor'

describe('timing methods', () => {
  const p = createCrossTemplate()
  const ch = p.channelizationSchemes[0]
  const fl = ch.flowSchemes[0]
  const sg = fl.signalSchemes[0]

  it('webster free cycle', () => {
    const r = optimizeSignalTiming(ch.approaches, fl, sg, { method: 'webster', targetVc: 0.9 })
    expect(r.cycleSec).toBeGreaterThanOrEqual(40)
    expect(r.method).toBe('webster')
    expect(r.appliedPhases.length).toBe(sg.phases.length)
  })

  it('fixed cycle keeps C', () => {
    const r = optimizeSignalTiming(ch.approaches, fl, sg, {
      method: 'fixed-cycle',
      fixedCycle: 100,
      targetVc: 0.9,
    })
    expect(r.cycleSec).toBe(100)
    expect(r.phaseGreens.length).toBeGreaterThan(0)
  })

  it('webster with fixedCycle flag', () => {
    const r = optimizeSignalTiming(ch.approaches, fl, sg, {
      method: 'webster',
      fixedCycle: 120,
    })
    expect(r.cycleSec).toBe(120)
  })

  it('equal and hcm-delay run', () => {
    const e = optimizeSignalTiming(ch.approaches, fl, sg, { method: 'equal', fixedCycle: 90 })
    expect(e.cycleSec).toBe(90)
    const h = optimizeSignalTiming(ch.approaches, fl, sg, { method: 'hcm-delay', minCycle: 50, maxCycle: 100 })
    expect(h.cycleSec).toBeGreaterThanOrEqual(50)
  })
})

describe('band corridor segments', () => {
  it('setSegmentLength moves downstream', () => {
    const p = createCrossTemplate()
    const c = p.bandCorridor
    const segs = corridorSegments(c)
    expect(segs.length).toBeGreaterThan(0)
    const toId = segs[0].toId
    const next = setSegmentLength(c, toId, 600)
    const s2 = corridorSegments(next)
    expect(Math.round(s2[0].lengthM)).toBe(600)
  })

  it('all band methods return offsets', () => {
    const p = createCrossTemplate()
    for (const method of ['classic', 'one-way', 'two-way-equal', 'graphical', 'optimized-scan'] as const) {
      const r = optimizeCorridor({ ...p.bandCorridor, method })
      expect(r.offsets.length).toBe(p.bandCorridor.nodes.length)
    }
  })
})
