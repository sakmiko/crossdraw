import type { BandCorridor, BandIntersection, BandResult } from '../types'
import { optimizeBandClassic, optimizeBandMaxScan } from './band'

export function corridorToIntersections(c: BandCorridor): BandIntersection[] {
  return c.nodes.map((n) => ({
    id: n.id,
    name: n.name,
    distanceM: n.distanceM,
    greenRatio: n.greenRatio,
    offsetSec: n.offsetSec,
  }))
}

export function optimizeCorridor(c: BandCorridor): BandResult {
  const nodes = corridorToIntersections(c)
  const cycle = c.nodes[0]?.cycleSec ?? 90
  if (c.method === 'one-way') {
    const v = (c.speedKmh * 1000) / 3600
    const offsets = c.nodes.map((n, i) => {
      if (i === 0) return { id: n.id, offsetSec: 0 }
      const dist = n.distanceM - c.nodes[0].distanceM
      const off = ((dist / v) % cycle + cycle) % cycle
      return { id: n.id, offsetSec: off }
    })
    const band = Math.min(...c.nodes.map((n) => n.greenRatio)) * cycle
    return {
      method: 'one-way',
      halfCycleDistanceM: (v * cycle) / 2,
      bandwidthRatio: Math.min(0.5, band / cycle),
      bandwidthSec: band,
      offsets,
      standardSpeedKmh: c.speedKmh,
    }
  }
  if (c.method === 'optimized-scan') {
    return optimizeBandMaxScan(nodes, cycle, c.speedKmh)
  }
  return optimizeBandClassic(nodes, cycle, c.speedKmh)
}

export function applyOffsetsToCorridor(c: BandCorridor, result: BandResult): BandCorridor {
  const map = new Map(result.offsets.map((o) => [o.id, o.offsetSec]))
  return {
    ...c,
    nodes: c.nodes.map((n) => ({
      ...n,
      offsetSec: n.lockedOffset ? n.offsetSec : (map.get(n.id) ?? n.offsetSec),
    })),
  }
}
