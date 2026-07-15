import type { BandCorridor, BandIntersection, BandResult } from '../types'
import {
  optimizeBandClassic,
  optimizeBandGraphical,
  optimizeBandMaxScan,
  optimizeBandOneWay,
  optimizeBandTwoWayEqual,
  scoreOffsets,
} from './band'

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
  switch (c.method) {
    case 'one-way':
      return optimizeBandOneWay(nodes, cycle, c.speedKmh)
    case 'optimized-scan':
      return optimizeBandMaxScan(nodes, cycle, c.speedKmh)
    case 'two-way-equal':
      return optimizeBandTwoWayEqual(nodes, cycle, c.speedKmh)
    case 'graphical':
      return optimizeBandGraphical(nodes, cycle, c.speedKmh)
    case 'classic':
    default:
      return optimizeBandClassic(nodes, cycle, c.speedKmh)
  }
}

/**
 * Apply optimizer offsets but keep locked nodes.
 * Then re-measure bandwidth on the *actual* applied offsets (including locks).
 */
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

/** Re-measure band KPIs for current corridor offsets (respects manual/locked values). */
export function measureCorridor(c: BandCorridor): BandResult {
  const nodes = corridorToIntersections(c)
  const C = c.nodes[0]?.cycleSec ?? 90
  const v = (c.speedKmh * 1000) / 3600
  const offsets = nodes.map((n) => n.offsetSec)
  const scored = scoreOffsets(nodes, C, offsets, v)
  const mean = (scored.forwardSec + scored.backwardSec) / 2
  const oneWay = c.method === 'one-way'
  return {
    method: c.method,
    halfCycleDistanceM: (v * C) / 2,
    bandwidthRatio: oneWay ? scored.forwardSec / C : mean / C,
    bandwidthSec: oneWay ? scored.forwardSec : mean,
    offsets: nodes.map((n) => ({ id: n.id, offsetSec: n.offsetSec })),
    standardSpeedKmh: c.speedKmh,
    forwardBandwidthSec: scored.forwardSec,
    backwardBandwidthSec: oneWay ? 0 : scored.backwardSec,
  }
}

export function corridorSegments(c: BandCorridor): {
  fromId: string
  toId: string
  fromName: string
  toName: string
  lengthM: number
}[] {
  const nodes = [...c.nodes].sort((a, b) => a.distanceM - b.distanceM)
  const out = []
  for (let i = 1; i < nodes.length; i++) {
    out.push({
      fromId: nodes[i - 1].id,
      toId: nodes[i].id,
      fromName: nodes[i - 1].name,
      toName: nodes[i].name,
      lengthM: nodes[i].distanceM - nodes[i - 1].distanceM,
    })
  }
  return out
}

export function setSegmentLength(
  c: BandCorridor,
  toNodeId: string,
  lengthM: number,
): BandCorridor {
  const nodes = [...c.nodes].sort((a, b) => a.distanceM - b.distanceM)
  const idx = nodes.findIndex((n) => n.id === toNodeId)
  if (idx <= 0) return c
  const prev = nodes[idx - 1]
  const next = nodes[idx]
  const newPos = prev.distanceM + Math.max(50, lengthM)
  const delta = newPos - next.distanceM
  const map = new Map(c.nodes.map((n) => [n.id, { ...n }]))
  for (let i = idx; i < nodes.length; i++) {
    const n = map.get(nodes[i].id)!
    n.distanceM = Math.max(0, n.distanceM + delta)
  }
  return { ...c, nodes: c.nodes.map((n) => map.get(n.id) ?? n) }
}


export type CorridorOptimizeSummary = {
  id: string
  name: string
  before: BandResult
  after: BandResult
  improved: boolean
}

/** Optimize every corridor independently; returns new corridors + per-corridor KPI delta. */
export function optimizeAllCorridors(corridors: BandCorridor[]): {
  corridors: BandCorridor[]
  summaries: CorridorOptimizeSummary[]
} {
  const summaries: CorridorOptimizeSummary[] = []
  const out: BandCorridor[] = []
  for (const c of corridors) {
    const before = measureCorridor(c)
    const opt = optimizeCorridor(c)
    const applied = applyOffsetsToCorridor(c, opt)
    const after = measureCorridor(applied)
    summaries.push({
      id: c.id,
      name: c.name,
      before,
      after,
      improved: after.bandwidthRatio + 1e-9 >= before.bandwidthRatio,
    })
    out.push(applied)
  }
  return { corridors: out, summaries }
}
