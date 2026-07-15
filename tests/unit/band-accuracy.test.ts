import { describe, expect, it } from 'vitest'
import {
  optimizeBandClassic,
  optimizeBandOneWay,
  scoreOffsets,
  twoNodeThroughBand,
} from '@/domain/analysis/band'
import { optimizeCorridor } from '@/domain/analysis/corridor'
import { createCrossTemplate } from '@/domain'

describe('green-band accuracy', () => {
  it('two-node zero travel equal green → band = g', () => {
    const C = 90
    const g = 40
    const b = twoNodeThroughBand(g, 0, g, 0, 0, C)
    expect(b).toBeCloseTo(40, 5)
  })

  it('two-node progressive perfect offset → band = g', () => {
    const C = 90
    const g = 36
    const travel = 25
    // o1 = o0 + travel keeps arrival at green start
    const b = twoNodeThroughBand(g, 0, g, travel, travel, C)
    expect(b).toBeCloseTo(g, 5)
  })

  it('two-node fully missed green → band ≈ 0', () => {
    const C = 90
    const b = twoNodeThroughBand(20, 0, 20, 45, 0, C)
    expect(b).toBeLessThan(1e-6)
  })

  it('scoreOffsets forward ≤ min green', () => {
    const nodes = [
      { id: '1', name: 'A', distanceM: 0, greenRatio: 0.5, offsetSec: 0 },
      { id: '2', name: 'B', distanceM: 400, greenRatio: 0.4, offsetSec: 0 },
    ]
    const C = 100
    const v = 40 / 3.6
    const r = scoreOffsets(nodes, C, [0, 20], v)
    expect(r.forwardSec).toBeLessThanOrEqual(40 + 1e-6)
    expect(r.forwardSec).toBeLessThanOrEqual(50 + 1e-6)
    expect(r.backwardSec).toBeGreaterThanOrEqual(0)
  })

  it('one-way uses forward only and positive band on progressive spacing', () => {
    const r = optimizeBandOneWay(
      [
        { id: '1', name: 'A', distanceM: 0, greenRatio: 0.5, offsetSec: 0 },
        { id: '2', name: 'B', distanceM: 500, greenRatio: 0.5, offsetSec: 0 },
        { id: '3', name: 'C', distanceM: 1000, greenRatio: 0.5, offsetSec: 0 },
      ],
      90,
      36,
    )
    expect(r.method).toBe('one-way')
    expect(r.forwardBandwidthSec).toBeGreaterThan(0)
    expect(r.backwardBandwidthSec).toBe(0)
    expect(r.bandwidthSec).toBeCloseTo(r.forwardBandwidthSec ?? 0, 5)
  })

  it('classic returns finite dual bands', () => {
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
    expect(r.forwardBandwidthSec ?? 0).toBeGreaterThan(0)
    expect((r.forwardBandwidthSec ?? 0) + (r.backwardBandwidthSec ?? 0)).toBeGreaterThan(0)
    expect(r.offsets.length).toBe(3)
  })

  it('corridor optimize matches node count', () => {
    const p = createCrossTemplate()
    const r = optimizeCorridor(p.bandCorridor)
    expect(r.offsets.length).toBe(p.bandCorridor.nodes.length)
    expect(r.forwardBandwidthSec ?? 0).toBeGreaterThanOrEqual(0)
  })
})
