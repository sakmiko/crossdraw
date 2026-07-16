/**
 * Offset scan: sample relative offset of node[1] (or free node) vs node[0],
 * score b↑+b↓ via scoreOffsets. Engineering discrete scan — not MIP.
 */
import type { BandCorridor, BandResult } from '../types'
import { corridorToIntersections, measureCorridor } from './corridor'
import { scoreOffsets } from './band'

export type OffsetScanPoint = {
  deltaSec: number
  forwardSec: number
  backwardSec: number
  totalSec: number
  ratio: number
}

export type OffsetScanResult = {
  C: number
  speedKmh: number
  freeNodeId: string
  freeNodeName: string
  baseOffsetSec: number
  bestDeltaSec: number
  best: OffsetScanPoint
  current: OffsetScanPoint
  points: OffsetScanPoint[]
  stepSec: number
  honesty: string
}

function speedMps(kmh: number): number {
  return Math.max(0.1, (kmh * 1000) / 3600)
}

function mod(x: number, C: number): number {
  return ((x % C) + C) % C
}

/**
 * Scan free node's offset = base + delta, delta in [0,C) step.
 * Prefer first unlocked node after ref (index 0); else node[1].
 */
export function scanCorridorOffsets(
  corridor: BandCorridor,
  opts: { stepSec?: number } = {},
): OffsetScanResult {
  const nodes = corridorToIntersections(corridor)
  const C = Math.max(1, corridor.nodes[0]?.cycleSec ?? 90)
  const step = Math.max(1, opts.stepSec ?? 2)
  const v = speedMps(corridor.speedKmh)
  const fullNodes = [...corridor.nodes].sort((a, b) => a.distanceM - b.distanceM)

  let freeIdx = fullNodes.findIndex((n, i) => i > 0 && !n.lockedOffset)
  if (freeIdx < 0) freeIdx = Math.min(1, fullNodes.length - 1)
  const free = fullNodes[freeIdx]
  const freeNodeId = free?.id ?? fullNodes[0]?.id ?? ''
  const freeNodeName = free?.name ?? '—'
  const baseOffsetSec = free?.offsetSec ?? 0

  // map id -> index in nodes (same order as corridorToIntersections uses map order)
  const idOrder = nodes.map((n) => n.id)
  const freePos = Math.max(0, idOrder.indexOf(freeNodeId))

  const baseOffsets = nodes.map((n) => n.offsetSec)
  const currentOffsets = baseOffsets.slice()
  const cur = scoreOffsets(nodes, C, currentOffsets, v)
  const current: OffsetScanPoint = {
    deltaSec: 0,
    forwardSec: cur.forwardSec,
    backwardSec: cur.backwardSec,
    totalSec: cur.forwardSec + cur.backwardSec,
    ratio: cur.ratio,
  }

  const points: OffsetScanPoint[] = []
  let best: OffsetScanPoint = { ...current, deltaSec: 0 }
  // scan absolute offset on free node through full cycle
  for (let o = 0; o < C; o += step) {
    const trial = baseOffsets.slice()
    trial[freePos] = o
    // keep other locked; unlocked non-free keep base
    for (let i = 0; i < fullNodes.length; i++) {
      const n = fullNodes[i]
      const pos = idOrder.indexOf(n.id)
      if (pos < 0) continue
      if (n.id === freeNodeId) trial[pos] = o
      else if (n.lockedOffset) trial[pos] = n.offsetSec
    }
    const s = scoreOffsets(nodes, C, trial, v)
    const deltaSec = mod(o - baseOffsetSec, C)
    // store by absolute o for chart x; use o as x key via delta from 0 for simplicity
    const pt: OffsetScanPoint = {
      deltaSec: o, // absolute offset for chart axis
      forwardSec: s.forwardSec,
      backwardSec: s.backwardSec,
      totalSec: s.forwardSec + s.backwardSec,
      ratio: s.ratio,
    }
    points.push(pt)
    if (pt.totalSec > best.totalSec) best = pt
  }

  // if empty (1 node)
  if (!points.length) {
    points.push(current)
    best = current
  }

  return {
    C,
    speedKmh: corridor.speedKmh,
    freeNodeId,
    freeNodeName,
    baseOffsetSec,
    bestDeltaSec: best.deltaSec,
    best,
    current: {
      ...current,
      deltaSec: baseOffsetSec,
    },
    points,
    stepSec: step,
    honesty: '离散扫描自由节点相位差 · scoreOffsets 同源 · 非 MAXBAND-MIP',
  }
}

/** Apply best absolute offset from scan to free node (respect locks). */
export function applyOffsetScanBest(corridor: BandCorridor, scan: OffsetScanResult): BandCorridor {
  return {
    ...corridor,
    nodes: corridor.nodes.map((n) => {
      if (n.id !== scan.freeNodeId) return n
      if (n.lockedOffset) return n
      return { ...n, offsetSec: Math.round(scan.bestDeltaSec * 10) / 10 }
    }),
  }
}

export function offsetScanMarkdown(projectName: string, corridorName: string, scan: OffsetScanResult): string {
  return [
    `# ${projectName} · ${corridorName} · 相位差扫描`,
    '',
    `- 自由节点：**${scan.freeNodeName}** · C=${scan.C}s · 步长 ${scan.stepSec}s`,
    `- 当前 o=${scan.current.deltaSec.toFixed(1)}s · b↑ ${scan.current.forwardSec.toFixed(1)} + b↓ ${scan.current.backwardSec.toFixed(1)} = **${scan.current.totalSec.toFixed(1)}s**`,
    `- 最优 o=**${scan.bestDeltaSec.toFixed(1)}s** · b↑ ${scan.best.forwardSec.toFixed(1)} + b↓ ${scan.best.backwardSec.toFixed(1)} = **${scan.best.totalSec.toFixed(1)}s**`,
    '',
    '| o s | b↑ | b↓ | 合计 | 比 |',
    '|----:|---:|---:|-----:|---:|',
    ...scan.points
      .filter((_, i) => i % Math.max(1, Math.floor(scan.points.length / 24)) === 0)
      .map(
        (p) =>
          `| ${p.deltaSec.toFixed(0)} | ${p.forwardSec.toFixed(1)} | ${p.backwardSec.toFixed(1)} | ${p.totalSec.toFixed(1)} | ${(p.ratio * 100).toFixed(1)}% |`,
      ),
    '',
    `- ${scan.honesty}`,
  ].join('\n')
}

export function offsetScanCsv(scan: OffsetScanResult): string {
  return [
    'offsetSec,forwardSec,backwardSec,totalSec,ratio',
    ...scan.points.map(
      (p) =>
        `${p.deltaSec.toFixed(1)},${p.forwardSec.toFixed(2)},${p.backwardSec.toFixed(2)},${p.totalSec.toFixed(2)},${p.ratio.toFixed(4)}`,
    ),
  ].join('\n')
}

export function measureAfterScan(corridor: BandCorridor, scan: OffsetScanResult): BandResult {
  return measureCorridor(applyOffsetScanBest(corridor, scan))
}
