import type { BandIntersection, BandResult } from '../types'

export type BandMethod = 'classic' | 'optimized-scan' | 'one-way' | 'two-way-equal' | 'graphical'

/**
 * Classic numerical two-way band (数解法): scan half-cycle distance a ≈ v·C/2.
 * Textbook arterial coordination.
 */
export function optimizeBandClassic(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  return scanHalfCycle(nodes, cycleSec, speedKmh, 'classic', 8, 12)
}

/**
 * MAXBAND-inspired denser scan + local offset fine-tune (not full MIP).
 * Little et al. 1981 idea: maximize green band.
 */
export function optimizeBandMaxScan(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'optimized-scan')
  const v = (speedKmh * 1000) / 3600
  const a0 = (v * cycleSec) / 2
  let best = evaluateTwoWayBand(nodes, cycleSec, a0, v)
  let bestA = a0

  for (let k = -24; k <= 24; k++) {
    const a = a0 + k * 4
    if (a <= 10) continue
    const scored = evaluateTwoWayBand(nodes, cycleSec, a, v)
    for (let d = -12; d <= 12; d += 2) {
      const offsets = scored.offsets.slice()
      if (offsets.length > 1) {
        offsets[1] = (((offsets[1] + d) % cycleSec) + cycleSec) % cycleSec
        for (let i = 2; i < offsets.length; i++) {
          const dist = nodes[i].distanceM - nodes[0].distanceM
          const ideal = (dist / a) * (cycleSec / 2)
          offsets[i] = ((ideal % cycleSec) + cycleSec) % cycleSec
        }
      }
      const rescore = scoreOffsets(nodes, cycleSec, offsets, v)
      if (rescore.ratio > best.ratio) {
        best = { ...rescore, offsets }
        bestA = a
      }
    }
    if (scored.ratio > best.ratio) {
      best = scored
      bestA = a
    }
  }

  return {
    method: 'optimized-scan',
    halfCycleDistanceM: bestA,
    bandwidthRatio: best.ratio,
    bandwidthSec: best.ratio * cycleSec,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: best.offsets[i] ?? 0 })),
    standardSpeedKmh: ((2 * bestA) / cycleSec) * 3.6,
    forwardBandwidthSec: best.forwardSec,
    backwardBandwidthSec: best.backwardSec,
  }
}

/** One-way progressive signal system: o_i = d_i / v */
export function optimizeBandOneWay(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'one-way')
  const v = (speedKmh * 1000) / 3600
  const C = cycleSec
  const offsets = nodes.map((n, i) => {
    if (i === 0) return 0
    const dist = n.distanceM - nodes[0].distanceM
    return ((dist / v) % C + C) % C
  })
  const scored = scoreOffsets(nodes, C, offsets, v)
  // one-way: emphasize forward
  const band = scored.forwardSec
  const ratio = Math.min(0.6, band / C)
  return {
    method: 'one-way',
    halfCycleDistanceM: (v * C) / 2,
    bandwidthRatio: ratio,
    bandwidthSec: band,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: offsets[i] ?? 0 })),
    standardSpeedKmh: speedKmh,
    forwardBandwidthSec: scored.forwardSec,
    backwardBandwidthSec: 0,
  }
}

/**
 * Two-way equal bandwidth preference: maximize min(forward, backward).
 * Same a-scan as classic but selection criterion is equal-band.
 */
export function optimizeBandTwoWayEqual(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'two-way-equal')
  const v = (speedKmh * 1000) / 3600
  const a0 = (v * cycleSec) / 2
  let bestA = a0
  let bestScore = -1
  let best = evaluateTwoWayBand(nodes, cycleSec, a0, v)

  for (let k = -16; k <= 16; k++) {
    const a = a0 + k * 6
    if (a <= 10) continue
    const scored = evaluateTwoWayBand(nodes, cycleSec, a, v)
    const equal = Math.min(scored.forwardSec, scored.backwardSec)
    const balance = 1 - Math.abs(scored.forwardSec - scored.backwardSec) / Math.max(cycleSec, 1)
    const score = equal * (0.7 + 0.3 * balance)
    if (score > bestScore) {
      bestScore = score
      best = scored
      bestA = a
    }
  }
  const band = Math.min(best.forwardSec, best.backwardSec)
  return {
    method: 'two-way-equal',
    halfCycleDistanceM: bestA,
    bandwidthRatio: Math.min(0.55, band / cycleSec),
    bandwidthSec: band,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: best.offsets[i] ?? 0 })),
    standardSpeedKmh: ((2 * bestA) / cycleSec) * 3.6,
    forwardBandwidthSec: best.forwardSec,
    backwardBandwidthSec: best.backwardSec,
  }
}

/**
 * Graphical method (图解法): force a = v·C/2 exactly (ideal half-cycle spacing map).
 */
export function optimizeBandGraphical(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'graphical')
  const v = (speedKmh * 1000) / 3600
  const a = (v * cycleSec) / 2
  const scored = evaluateTwoWayBand(nodes, cycleSec, a, v)
  return {
    method: 'graphical',
    halfCycleDistanceM: a,
    bandwidthRatio: scored.ratio,
    bandwidthSec: scored.ratio * cycleSec,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: scored.offsets[i] ?? 0 })),
    standardSpeedKmh: speedKmh,
    forwardBandwidthSec: scored.forwardSec,
    backwardBandwidthSec: scored.backwardSec,
  }
}

function scanHalfCycle(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
  method: string,
  step: number,
  halfRange: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, method)
  const v = (speedKmh * 1000) / 3600
  const a0 = (v * cycleSec) / 2
  let bestA = a0
  let bestB = -1
  let bestOffsets: number[] = nodes.map(() => 0)
  let bestFwd = 0
  let bestBwd = 0

  for (let k = -halfRange; k <= halfRange; k++) {
    const a = a0 + k * step
    if (a <= 10) continue
    const scored = evaluateTwoWayBand(nodes, cycleSec, a, v)
    if (scored.ratio > bestB) {
      bestB = scored.ratio
      bestA = a
      bestOffsets = scored.offsets
      bestFwd = scored.forwardSec
      bestBwd = scored.backwardSec
    }
  }

  return {
    method,
    halfCycleDistanceM: bestA,
    bandwidthRatio: bestB,
    bandwidthSec: bestB * cycleSec,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: bestOffsets[i] ?? 0 })),
    standardSpeedKmh: ((2 * bestA) / cycleSec) * 3.6,
    forwardBandwidthSec: bestFwd,
    backwardBandwidthSec: bestBwd,
  }
}

function emptyResult(nodes: BandIntersection[], speedKmh: number, method: string): BandResult {
  return {
    method,
    halfCycleDistanceM: 0,
    bandwidthRatio: 0,
    bandwidthSec: 0,
    offsets: nodes.map((n) => ({ id: n.id, offsetSec: 0 })),
    standardSpeedKmh: speedKmh,
    forwardBandwidthSec: 0,
    backwardBandwidthSec: 0,
  }
}

function evaluateTwoWayBand(
  nodes: BandIntersection[],
  C: number,
  a: number,
  v: number,
): { ratio: number; offsets: number[]; forwardSec: number; backwardSec: number } {
  const offsets: number[] = [0]
  for (let i = 1; i < nodes.length; i++) {
    const dist = nodes[i].distanceM - nodes[0].distanceM
    const ideal = (dist / a) * (C / 2)
    offsets.push(((ideal % C) + C) % C)
  }
  return { offsets, ...scoreOffsets(nodes, C, offsets, v) }
}

function scoreOffsets(
  nodes: BandIntersection[],
  C: number,
  offsets: number[],
  v: number,
): { ratio: number; forwardSec: number; backwardSec: number } {
  if (nodes.length < 2) {
    const g = (nodes[0]?.greenRatio ?? 0) * C
    return { ratio: nodes[0]?.greenRatio ?? 0, forwardSec: g, backwardSec: g }
  }

  let forward = Math.min(...nodes.map((n) => n.greenRatio * C))
  let backward = forward

  for (let i = 1; i < nodes.length; i++) {
    const dist = nodes[i].distanceM - nodes[i - 1].distanceM
    const travel = dist / Math.max(0.1, v)
    const o0 = offsets[i - 1] ?? 0
    const o1 = offsets[i] ?? 0
    const g0 = nodes[i - 1].greenRatio * C
    const g1 = nodes[i].greenRatio * C
    const arrive = ((o0 + travel) % C + C) % C
    forward = Math.min(forward, circularOverlap(arrive, g0, o1, g1, C))
    const arriveB = ((o1 + travel) % C + C) % C
    backward = Math.min(backward, circularOverlap(arriveB, g1, o0, g0, C))
  }

  const gaps: number[] = []
  for (let i = 1; i < nodes.length; i++) gaps.push(nodes[i].distanceM - nodes[i - 1].distanceM)
  const mean = gaps.reduce((s, g) => s + g, 0) / Math.max(1, gaps.length)
  const varc = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / Math.max(1, gaps.length)
  const reg = Math.max(0.55, 1 - (Math.sqrt(varc) / Math.max(mean, 1)) * 0.35)
  const band = ((forward + backward) / 2) * reg
  const ratio = Math.max(0, Math.min(0.55, band / C))
  return { ratio, forwardSec: Math.max(0, forward), backwardSec: Math.max(0, backward) }
}

function circularOverlap(aStart: number, aLen: number, bStart: number, bLen: number, C: number): number {
  const step = Math.max(1, Math.round(C / 90))
  let hit = 0
  let total = 0
  for (let t = 0; t < C; t += step) {
    total += step
    if (inGreen(t, aStart, aLen, C) && inGreen(t, bStart, bLen, C)) hit += step
  }
  const cover = hit / Math.max(1, total)
  return Math.min(aLen, bLen) * Math.min(1, cover * (C / Math.max(aLen, bLen, 1)))
}

function inGreen(t: number, start: number, len: number, C: number): boolean {
  const x = ((t - start) % C + C) % C
  return x < len
}
