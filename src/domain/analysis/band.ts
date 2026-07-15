import type { BandIntersection, BandResult } from '../types'

export type BandMethod = 'classic' | 'optimized-scan' | 'one-way' | 'two-way-equal' | 'graphical'

/**
 * Green-band (绿波) bandwidth evaluation — cycle-domain through-band.
 *
 * Definitions (textbook / MAXBAND-style engineering form):
 * - Offset o_i: start of green relative to master clock (s), in [0, C).
 * - Green length g_i = λ_i · C (s).
 * - Travel time τ_{i,i+1} = Δd / v (s).
 * - Forward through-band b_f: max duration such that a platoon leaving
 *   each green window can hit every downstream green after cumulative travel.
 * - Backward b_b: same reverse direction.
 *
 * Exact b for two signals: intersection length of green intervals after
 * shifting by travel time. Multi-node: successive pairwise min of through-band
 * using cumulative relative offsets (no ad-hoc "regularity" shrink).
 *
 * Methods only choose offsets; scoring always uses measureThroughBand.
 */

export function optimizeBandClassic(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  return scanHalfCycle(nodes, cycleSec, speedKmh, 'classic', 5, 20)
}

export function optimizeBandMaxScan(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'optimized-scan')
  const v = speedMps(speedKmh)
  const C = cycleSec
  const a0 = (v * C) / 2
  let bestA = a0
  let best = evaluateTwoWayBand(nodes, C, a0, v)

  for (let k = -30; k <= 30; k++) {
    const a = a0 + k * 3
    if (a <= 20) continue
    const base = evaluateTwoWayBand(nodes, C, a, v)
    if (base.forwardSec + base.backwardSec > best.forwardSec + best.backwardSec) {
      best = base
      bestA = a
    }
    // fine-tune second node offset ±15s
    for (let d = -15; d <= 15; d += 1) {
      const offsets = base.offsets.slice()
      if (offsets.length < 2) continue
      offsets[1] = mod(offsets[1] + d, C)
      // recompute downstream from a with first link fixed offset[1]
      for (let i = 2; i < nodes.length; i++) {
        const dist = nodes[i].distanceM - nodes[0].distanceM
        offsets[i] = mod((dist / a) * (C / 2), C)
      }
      const scored = scoreOffsets(nodes, C, offsets, v)
      if (scored.forwardSec + scored.backwardSec > best.forwardSec + best.backwardSec) {
        best = { ...scored, offsets }
        bestA = a
      }
    }
  }
  return toResult('optimized-scan', nodes, C, bestA, speedKmh, best)
}

/** One-way: o_i = cumulative travel from node 0 (progressive system). */
export function optimizeBandOneWay(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'one-way')
  const v = speedMps(speedKmh)
  const C = cycleSec
  const offsets = nodes.map((n, i) => {
    if (i === 0) return 0
    const dist = n.distanceM - nodes[0].distanceM
    return mod(dist / v, C)
  })
  const scored = scoreOffsets(nodes, C, offsets, v)
  return {
    method: 'one-way',
    halfCycleDistanceM: (v * C) / 2,
    bandwidthRatio: scored.forwardSec / C,
    bandwidthSec: scored.forwardSec,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: offsets[i] ?? 0 })),
    standardSpeedKmh: speedKmh,
    forwardBandwidthSec: scored.forwardSec,
    backwardBandwidthSec: 0,
  }
}

export function optimizeBandTwoWayEqual(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'two-way-equal')
  const v = speedMps(speedKmh)
  const C = cycleSec
  const a0 = (v * C) / 2
  let bestA = a0
  let best = evaluateTwoWayBand(nodes, C, a0, v)
  let bestScore = Math.min(best.forwardSec, best.backwardSec)

  for (let k = -24; k <= 24; k++) {
    const a = a0 + k * 4
    if (a <= 20) continue
    const scored = evaluateTwoWayBand(nodes, C, a, v)
    const equal = Math.min(scored.forwardSec, scored.backwardSec)
    if (equal > bestScore) {
      bestScore = equal
      best = scored
      bestA = a
    }
  }
  const band = Math.min(best.forwardSec, best.backwardSec)
  return {
    method: 'two-way-equal',
    halfCycleDistanceM: bestA,
    bandwidthRatio: band / C,
    bandwidthSec: band,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: best.offsets[i] ?? 0 })),
    standardSpeedKmh: ((2 * bestA) / C) * 3.6,
    forwardBandwidthSec: best.forwardSec,
    backwardBandwidthSec: best.backwardSec,
  }
}

/** Graphical: force a = v·C/2 exactly (ideal half-cycle map). */
export function optimizeBandGraphical(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, 'graphical')
  const v = speedMps(speedKmh)
  const C = cycleSec
  const a = (v * C) / 2
  const scored = evaluateTwoWayBand(nodes, C, a, v)
  return toResult('graphical', nodes, C, a, speedKmh, scored)
}

// --- core measurement -------------------------------------------------------

function scanHalfCycle(
  nodes: BandIntersection[],
  cycleSec: number,
  speedKmh: number,
  method: string,
  step: number,
  halfRange: number,
): BandResult {
  if (nodes.length < 2) return emptyResult(nodes, speedKmh, method)
  const v = speedMps(speedKmh)
  const C = cycleSec
  const a0 = (v * C) / 2
  let bestA = a0
  let best = evaluateTwoWayBand(nodes, C, a0, v)

  for (let k = -halfRange; k <= halfRange; k++) {
    const a = a0 + k * step
    if (a <= 20) continue
    const scored = evaluateTwoWayBand(nodes, C, a, v)
    // classic: maximize average of both directions (true seconds)
    if (scored.forwardSec + scored.backwardSec > best.forwardSec + best.backwardSec) {
      best = scored
      bestA = a
    }
  }
  return toResult(method, nodes, C, bestA, speedKmh, best)
}

function evaluateTwoWayBand(
  nodes: BandIntersection[],
  C: number,
  a: number,
  v: number,
): { offsets: number[]; forwardSec: number; backwardSec: number; ratio: number } {
  const offsets: number[] = [0]
  for (let i = 1; i < nodes.length; i++) {
    const dist = nodes[i].distanceM - nodes[0].distanceM
    // two-way ideal: half-cycle map o = (d/a)*(C/2)
    offsets.push(mod((dist / a) * (C / 2), C))
  }
  return { offsets, ...scoreOffsets(nodes, C, offsets, v) }
}

/**
 * Measure through-band (s) for given offsets.
 * Forward: chain from node 0 → n-1.
 * Backward: chain from n-1 → 0.
 */
export function scoreOffsets(
  nodes: BandIntersection[],
  C: number,
  offsets: number[],
  v: number,
): { ratio: number; forwardSec: number; backwardSec: number } {
  if (nodes.length < 1) return { ratio: 0, forwardSec: 0, backwardSec: 0 }
  if (nodes.length === 1) {
    const g = nodes[0].greenRatio * C
    return { ratio: nodes[0].greenRatio, forwardSec: g, backwardSec: g }
  }

  const greens = nodes.map((n, i) => ({
    start: mod(offsets[i] ?? n.offsetSec ?? 0, C),
    len: Math.max(0, Math.min(C, n.greenRatio * C)),
  }))

  const forwardSec = throughBandSeconds(greens, nodes, C, v, 'forward')
  const backwardSec = throughBandSeconds(greens, nodes, C, v, 'backward')
  // ratio: mean of both directions / C (one-way callers override)
  const ratio = (forwardSec + backwardSec) / 2 / C
  return {
    ratio: clamp(ratio, 0, 1),
    forwardSec,
    backwardSec,
  }
}

/**
 * Multi-node through-band via successive relative green intersection.
 * Maintains the feasible departure interval at the current node as a set of
 * circular arcs; intersects with next green shifted by -τ.
 */
function throughBandSeconds(
  greens: { start: number; len: number }[],
  nodes: BandIntersection[],
  C: number,
  v: number,
  dir: 'forward' | 'backward',
): number {
  const n = greens.length
  if (n < 2) return greens[0]?.len ?? 0

  const order =
    dir === 'forward' ? Array.from({ length: n }, (_, i) => i) : Array.from({ length: n }, (_, i) => n - 1 - i)

  // feasible set at first node = its full green (as arcs)
  let arcs = greenToArcs(greens[order[0]].start, greens[order[0]].len, C)

  for (let k = 1; k < order.length; k++) {
    const iPrev = order[k - 1]
    const iNext = order[k]
    const dist = Math.abs(nodes[iNext].distanceM - nodes[iPrev].distanceM)
    const tau = dist / Math.max(0.1, v)
    // map feasible departures to arrival times at next: t' = t + τ
    const arrived = shiftArcs(arcs, tau, C)
    // intersect with next green
    const nextGreen = greenToArcs(greens[iNext].start, greens[iNext].len, C)
    const hit = intersectArcSets(arrived, nextGreen, C)
    // map back to departure domain at first? For successive band width we only
    // need the measure of the intersection set in time (band length invariant
    // under circular shift).
    arcs = hit
    if (totalArcLength(arcs) <= 1e-6) return 0
  }
  return totalArcLength(arcs)
}

// --- circular arcs on [0, C) ------------------------------------------------

type Arc = { a: number; b: number } // half-open [a,b) on unwrapped or split

function greenToArcs(start: number, len: number, C: number): Arc[] {
  if (len <= 0) return []
  if (len >= C) return [{ a: 0, b: C }]
  const s = mod(start, C)
  if (s + len <= C) return [{ a: s, b: s + len }]
  return [
    { a: s, b: C },
    { a: 0, b: s + len - C },
  ]
}

function shiftArcs(arcs: Arc[], dt: number, C: number): Arc[] {
  const out: Arc[] = []
  for (const arc of arcs) {
    const a = mod(arc.a + dt, C)
    const len = arc.b - arc.a
    if (len <= 0) continue
    if (a + len <= C) out.push({ a, b: a + len })
    else {
      out.push({ a, b: C })
      out.push({ a: 0, b: a + len - C })
    }
  }
  return mergeArcs(out, C)
}

function intersectArcSets(A: Arc[], B: Arc[], C: number): Arc[] {
  const out: Arc[] = []
  for (const a of A) {
    for (const b of B) {
      const lo = Math.max(a.a, b.a)
      const hi = Math.min(a.b, b.b)
      if (hi > lo + 1e-9) out.push({ a: lo, b: hi })
    }
  }
  return mergeArcs(out, C)
}

function mergeArcs(arcs: Arc[], C: number): Arc[] {
  if (!arcs.length) return []
  const s = arcs.slice().sort((x, y) => x.a - y.a)
  const out: Arc[] = [{ ...s[0] }]
  for (let i = 1; i < s.length; i++) {
    const last = out[out.length - 1]
    if (s[i].a <= last.b + 1e-9) last.b = Math.max(last.b, s[i].b)
    else out.push({ ...s[i] })
  }
  // optional: merge wrap around if first starts 0 and last ends C
  if (out.length >= 2 && out[0].a <= 1e-9 && out[out.length - 1].b >= C - 1e-9) {
    // keep split form for length measure; measure is fine either way
  }
  return out
}

function totalArcLength(arcs: Arc[]): number {
  return arcs.reduce((s, a) => s + Math.max(0, a.b - a.a), 0)
}

// --- helpers ----------------------------------------------------------------

function toResult(
  method: string,
  nodes: BandIntersection[],
  C: number,
  a: number,
  speedKmh: number,
  scored: { offsets: number[]; forwardSec: number; backwardSec: number; ratio: number },
): BandResult {
  const meanBand = (scored.forwardSec + scored.backwardSec) / 2
  return {
    method,
    halfCycleDistanceM: a,
    bandwidthRatio: clamp(meanBand / C, 0, 1),
    bandwidthSec: meanBand,
    offsets: nodes.map((n, i) => ({ id: n.id, offsetSec: scored.offsets[i] ?? 0 })),
    standardSpeedKmh: method === 'one-way' ? speedKmh : ((2 * a) / C) * 3.6,
    forwardBandwidthSec: scored.forwardSec,
    backwardBandwidthSec: scored.backwardSec,
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

function speedMps(speedKmh: number): number {
  return (speedKmh * 1000) / 3600
}

function mod(x: number, C: number): number {
  return ((x % C) + C) % C
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

/** Two-node exact band for unit tests / documentation */
export function twoNodeThroughBand(
  g0: number,
  o0: number,
  g1: number,
  o1: number,
  travelSec: number,
  C: number,
): number {
  const arcs0 = greenToArcs(o0, g0, C)
  const arrived = shiftArcs(arcs0, travelSec, C)
  const arcs1 = greenToArcs(o1, g1, C)
  return totalArcLength(intersectArcSets(arrived, arcs1, C))
}
