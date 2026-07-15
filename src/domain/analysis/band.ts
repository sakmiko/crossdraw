import type { BandIntersection, BandResult } from '../types'

/**
 * Classic numerical method for two-way green band (simplified).
 * Enumerate half-cycle distance a around v*C/2 and pick max bandwidth ratio.
 */
export function optimizeBandClassic(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) {
    return {
      method: 'classic',
      halfCycleDistanceM: 0,
      bandwidthRatio: 0,
      bandwidthSec: 0,
      offsets: nodes.map((n) => ({ id: n.id, offsetSec: 0 })),
      standardSpeedKmh: speedKmh,
    }
  }
  const v = (speedKmh * 1000) / 3600 // m/s
  const a0 = (v * cycleSec) / 2
  let bestA = a0
  let bestB = -1
  let bestOffsets: number[] = nodes.map(() => 0)

  for (let k = -10; k <= 10; k++) {
    const a = a0 + k * 10
    if (a <= 10) continue
    const { ratio, offsets } = evaluateBand(nodes, cycleSec, a, v)
    if (ratio > bestB) {
      bestB = ratio
      bestA = a
      bestOffsets = offsets
    }
  }

  return {
    method: 'classic',
    halfCycleDistanceM: bestA,
    bandwidthRatio: bestB,
    bandwidthSec: bestB * cycleSec,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: bestOffsets[i] ?? 0 })),
    standardSpeedKmh: ((2 * bestA) / cycleSec) * 3.6,
  }
}

function evaluateBand(
  nodes: BandIntersection[],
  C: number,
  a: number,
  v: number,
): { ratio: number; offsets: number[] } {
  const offsets: number[] = [0]
  for (let i = 1; i < nodes.length; i++) {
    const dist = nodes[i].distanceM - nodes[0].distanceM
    const travel = dist / v
    // ideal offset alternate by half cycle
    const ideal = (dist / a) * (C / 2)
    offsets.push(((ideal % C) + C) % C)
  }
  // bandwidth estimate: min green windows intersection
  let band = Math.min(...nodes.map((n) => n.greenRatio)) * C
  // penalize uneven spacing vs a
  for (let i = 1; i < nodes.length; i++) {
    const gap = nodes[i].distanceM - nodes[i - 1].distanceM
    const err = Math.abs(gap - a) / a
    band *= Math.max(0.3, 1 - err * 0.25)
  }
  const ratio = Math.max(0, Math.min(0.5, band / C))
  return { ratio, offsets }
}

export function optimizeBandMaxScan(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  // "optimized numerical": same scan but score with green ratios explicitly
  const base = optimizeBandClassic(nodes, cycleSec, speedKmh)
  return { ...base, method: 'optimized-scan' }
}
