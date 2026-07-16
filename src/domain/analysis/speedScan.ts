/**
 * Speed sensitivity scan: bandwidth vs design speed (offsets fixed).
 * Homology: measureCorridor / scoreOffsets. Engineering discrete — not MIP.
 */
import type { BandCorridor } from '../types'
import { corridorToIntersections, measureCorridor } from './corridor'
import { scoreOffsets } from './band'

export type SpeedScanPoint = {
  speedKmh: number
  forwardSec: number
  backwardSec: number
  totalSec: number
  ratio: number
}

export type SpeedScanResult = {
  C: number
  currentSpeedKmh: number
  minKmh: number
  maxKmh: number
  stepKmh: number
  best: SpeedScanPoint
  current: SpeedScanPoint
  points: SpeedScanPoint[]
  honesty: string
}

function speedMps(kmh: number): number {
  return Math.max(0.1, (kmh * 1000) / 3600)
}

export function scanCorridorSpeeds(
  corridor: BandCorridor,
  opts: { minKmh?: number; maxKmh?: number; stepKmh?: number } = {},
): SpeedScanResult {
  const C = Math.max(1, corridor.nodes[0]?.cycleSec ?? 90)
  const minKmh = Math.max(10, opts.minKmh ?? 30)
  const maxKmh = Math.max(minKmh + 5, opts.maxKmh ?? 80)
  const stepKmh = Math.max(1, opts.stepKmh ?? 2)
  const nodes = corridorToIntersections(corridor)
  const offsets = nodes.map((n) => n.offsetSec)

  const points: SpeedScanPoint[] = []
  for (let s = minKmh; s <= maxKmh + 1e-9; s += stepKmh) {
    const v = speedMps(s)
    const sc = scoreOffsets(nodes, C, offsets, v)
    points.push({
      speedKmh: Math.round(s * 10) / 10,
      forwardSec: sc.forwardSec,
      backwardSec: sc.backwardSec,
      totalSec: sc.forwardSec + sc.backwardSec,
      ratio: sc.ratio,
    })
  }

  const curV = speedMps(corridor.speedKmh)
  const curSc = scoreOffsets(nodes, C, offsets, curV)
  const current: SpeedScanPoint = {
    speedKmh: corridor.speedKmh,
    forwardSec: curSc.forwardSec,
    backwardSec: curSc.backwardSec,
    totalSec: curSc.forwardSec + curSc.backwardSec,
    ratio: curSc.ratio,
  }

  let best = points[0] ?? current
  for (const p of points) {
    if (p.totalSec > best.totalSec) best = p
  }

  return {
    C,
    currentSpeedKmh: corridor.speedKmh,
    minKmh,
    maxKmh,
    stepKmh,
    best,
    current,
    points,
    honesty: '固定相位差扫设计速度 · scoreOffsets 同源 · 非 MIP',
  }
}

export function applySpeedScanBest(corridor: BandCorridor, scan: SpeedScanResult): BandCorridor {
  return { ...corridor, speedKmh: scan.best.speedKmh }
}

export function speedScanMarkdown(
  projectName: string,
  corridorName: string,
  scan: SpeedScanResult,
): string {
  return [
    `# ${projectName} · ${corridorName} · 速度敏感性`,
    '',
    `- 当前 v=**${scan.currentSpeedKmh} km/h** · Σb=${scan.current.totalSec.toFixed(1)}s`,
    `- 最优 v=**${scan.best.speedKmh} km/h** · Σb=**${scan.best.totalSec.toFixed(1)}s** · 比 ${(scan.best.ratio * 100).toFixed(1)}%`,
    `- 范围 ${scan.minKmh}–${scan.maxKmh} · 步长 ${scan.stepKmh} · C=${scan.C}s`,
    '',
    '| v km/h | b↑ | b↓ | 合计 | 比 |',
    '|-------:|---:|---:|-----:|---:|',
    ...scan.points
      .filter((_, i) => i % Math.max(1, Math.floor(scan.points.length / 20)) === 0)
      .map(
        (p) =>
          `| ${p.speedKmh} | ${p.forwardSec.toFixed(1)} | ${p.backwardSec.toFixed(1)} | ${p.totalSec.toFixed(1)} | ${(p.ratio * 100).toFixed(1)}% |`,
      ),
    '',
    `- ${scan.honesty}`,
  ].join('\n')
}

export function speedScanCsv(scan: SpeedScanResult): string {
  return [
    'speedKmh,forwardSec,backwardSec,totalSec,ratio',
    ...scan.points.map(
      (p) =>
        `${p.speedKmh},${p.forwardSec.toFixed(2)},${p.backwardSec.toFixed(2)},${p.totalSec.toFixed(2)},${p.ratio.toFixed(4)}`,
    ),
  ].join('\n')
}

export function measureAtSpeed(corridor: BandCorridor, speedKmh: number) {
  return measureCorridor({ ...corridor, speedKmh })
}
