/**
 * Multi-node MAXBAND-style offset search (engineering discrete LP proxy).
 * - Decision vars: offset o_i ∈ [0, C) for free nodes; locked nodes fixed.
 * - Objective: α·b_f + β·b_b (default equal two-way), using exact arc through-band.
 * - Search: coarse grid then local refinement (not commercial MIP solver).
 */
import type { BandCorridor, BandIntersection, BandResult } from '../types'
import { scoreOffsets } from './band'

export type MaxbandOptions = {
  /** weight on forward bandwidth */
  alpha?: number
  /** weight on backward bandwidth */
  beta?: number
  /** coarse step seconds */
  coarseStep?: number
  /** fine step seconds */
  fineStep?: number
  /** local refine radius */
  fineRadius?: number
  /** max free nodes to grid-search fully (else sequential refine) */
  fullGridMaxFree?: number
}

function mod(x: number, C: number): number {
  return ((x % C) + C) % C
}

function speedMps(kmh: number): number {
  return (kmh * 1000) / 3600
}

function corridorNodes(c: BandCorridor): BandIntersection[] {
  return c.nodes.map((n) => ({
    id: n.id,
    name: n.name,
    distanceM: n.distanceM,
    greenRatio: n.greenRatio,
    offsetSec: n.offsetSec,
  }))
}

function objective(
  nodes: BandIntersection[],
  C: number,
  offsets: number[],
  v: number,
  alpha: number,
  beta: number,
): { score: number; forwardSec: number; backwardSec: number } {
  const s = scoreOffsets(nodes, C, offsets, v)
  return {
    score: alpha * s.forwardSec + beta * s.backwardSec,
    forwardSec: s.forwardSec,
    backwardSec: s.backwardSec,
  }
}

/**
 * Progressive seed: o_i = travel from node 0 (one-way progressive).
 */
function progressiveSeed(nodes: BandIntersection[], C: number, v: number): number[] {
  return nodes.map((n, i) => {
    if (i === 0) return 0
    return mod((n.distanceM - nodes[0].distanceM) / Math.max(0.1, v), C)
  })
}

/**
 * Half-cycle two-way seed.
 */
function halfCycleSeed(nodes: BandIntersection[], C: number, v: number): number[] {
  const a = (v * C) / 2
  return nodes.map((n, i) => {
    if (i === 0) return 0
    const dist = n.distanceM - nodes[0].distanceM
    return mod((dist / Math.max(1, a)) * (C / 2), C)
  })
}

/**
 * Optimize free-node offsets with discrete MAXBAND objective.
 * Locked corridor nodes (lockedOffset) keep their offsetSec.
 */
export function optimizeBandMaxbandDiscrete(
  c: BandCorridor,
  opts: MaxbandOptions = {},
): BandResult {
  const nodes = corridorNodes(c)
  const C = c.nodes[0]?.cycleSec ?? 90
  const v = speedMps(c.speedKmh)
  const alpha = opts.alpha ?? 1
  const beta = opts.beta ?? (c.method === 'one-way' ? 0 : 1)
  const coarseStep = opts.coarseStep ?? 5
  const fineStep = opts.fineStep ?? 1
  const fineRadius = opts.fineRadius ?? 8
  const fullGridMaxFree = opts.fullGridMaxFree ?? 3

  if (nodes.length < 2) {
    return {
      method: 'maxband-discrete',
      halfCycleDistanceM: (v * C) / 2,
      bandwidthRatio: 0,
      bandwidthSec: 0,
      offsets: nodes.map((n) => ({ id: n.id, offsetSec: 0 })),
      standardSpeedKmh: c.speedKmh,
      forwardBandwidthSec: 0,
      backwardBandwidthSec: 0,
    }
  }

  const locked = c.nodes.map((n) => !!n.lockedOffset)
  const freeIdx = c.nodes.map((n, i) => (n.lockedOffset ? -1 : i)).filter((i) => i > 0) // keep 0 as master usually free but can lock

  // Always allow node 0 fixed at 0 unless locked with value
  const base = progressiveSeed(nodes, C, v)
  for (let i = 0; i < c.nodes.length; i++) {
    if (locked[i]) base[i] = c.nodes[i].offsetSec
  }
  if (!locked[0]) base[0] = 0

  let best = base.slice()
  let bestObj = objective(nodes, C, best, v, alpha, beta)

  // Also try half-cycle seed
  const hc = halfCycleSeed(nodes, C, v)
  for (let i = 0; i < c.nodes.length; i++) {
    if (locked[i]) hc[i] = c.nodes[i].offsetSec
  }
  if (!locked[0]) hc[0] = 0
  const hcObj = objective(nodes, C, hc, v, alpha, beta)
  if (hcObj.score > bestObj.score) {
    best = hc
    bestObj = hcObj
  }

  const free = freeIdx.filter((i) => i >= 0)
  // Include index 0 in free if not locked and we want to search? usually master=0
  const searchFree = free.length ? free : []

  if (searchFree.length > 0 && searchFree.length <= fullGridMaxFree) {
    // Full coarse cartesian product
    const steps: number[][] = searchFree.map(() => {
      const arr: number[] = []
      for (let t = 0; t < C; t += coarseStep) arr.push(t)
      return arr
    })
    const idx = searchFree.map(() => 0)
    const maxComb = steps.reduce((p, s) => p * s.length, 1)
    // Cap explosions
    const limit = Math.min(maxComb, 25000)
    for (let comb = 0; comb < limit; comb++) {
      let x = comb
      const cand = best.slice()
      for (let k = searchFree.length - 1; k >= 0; k--) {
        const s = steps[k]
        const pick = s[x % s.length]
        x = Math.floor(x / s.length)
        cand[searchFree[k]] = pick
      }
      if (!locked[0]) cand[0] = 0
      for (let i = 0; i < locked.length; i++) if (locked[i]) cand[i] = c.nodes[i].offsetSec
      const obj = objective(nodes, C, cand, v, alpha, beta)
      if (obj.score > bestObj.score + 1e-9) {
        bestObj = obj
        best = cand
      }
    }
  } else {
    // Sequential coordinate scan for many free nodes
    for (const i of searchFree) {
      let localBest = best[i]
      let localObj = bestObj
      for (let t = 0; t < C; t += coarseStep) {
        const cand = best.slice()
        cand[i] = t
        if (!locked[0]) cand[0] = 0
        for (let j = 0; j < locked.length; j++) if (locked[j]) cand[j] = c.nodes[j].offsetSec
        const obj = objective(nodes, C, cand, v, alpha, beta)
        if (obj.score > localObj.score + 1e-9) {
          localObj = obj
          localBest = t
          best = cand
          bestObj = obj
        }
      }
      best[i] = localBest
    }
  }

  // Fine local refinement
  for (const i of searchFree) {
    const center = best[i]
    for (let d = -fineRadius; d <= fineRadius; d += fineStep) {
      const cand = best.slice()
      cand[i] = mod(center + d, C)
      if (!locked[0]) cand[0] = 0
      for (let j = 0; j < locked.length; j++) if (locked[j]) cand[j] = c.nodes[j].offsetSec
      const obj = objective(nodes, C, cand, v, alpha, beta)
      if (obj.score > bestObj.score + 1e-9) {
        bestObj = obj
        best = cand
      }
    }
  }

  const mean = (bestObj.forwardSec + (beta > 0 ? bestObj.backwardSec : bestObj.forwardSec)) / (beta > 0 ? 2 : 1)
  return {
    method: 'maxband-discrete',
    halfCycleDistanceM: (v * C) / 2,
    bandwidthRatio: mean / C,
    bandwidthSec: mean,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: best[i] ?? 0 })),
    standardSpeedKmh: c.speedKmh,
    forwardBandwidthSec: bestObj.forwardSec,
    backwardBandwidthSec: beta > 0 ? bestObj.backwardSec : 0,
  }
}
