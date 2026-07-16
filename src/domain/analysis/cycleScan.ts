/**
 * Cycle sensitivity scan: for C in [min,max], fixed-cycle green by y, score delay/v/c.
 * Homology: optimizeSignalTiming(fixed-cycle) + analyzeIntersection. Not black-box.
 */
import type { Approach, FlowScheme, SignalScheme } from '../types'
import { analyzeIntersection } from './index'
import { optimizeSignalTiming } from './timing'

export type CycleScanPoint = {
  cycleSec: number
  avgDelay: number
  maxVc: number
  avgVc: number
  los: string
  Y: number
}

export type CycleScanResult = {
  minCycle: number
  maxCycle: number
  stepSec: number
  currentCycle: number
  points: CycleScanPoint[]
  bestDelay: CycleScanPoint
  bestVc: CycleScanPoint
  current: CycleScanPoint
  honesty: string
}

function scoreAtCycle(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  cycleSec: number,
): CycleScanPoint {
  const opt = optimizeSignalTiming(approaches, flow, signal, {
    method: 'fixed-cycle',
    fixedCycle: cycleSec,
    targetVc: 0.9,
  })
  const trial: SignalScheme = {
    ...signal,
    cycleSec: opt.cycleSec,
    phases: opt.appliedPhases,
  }
  const an = analyzeIntersection(approaches, flow, trial)
  let maxVc = 0
  for (const l of an.lanes) maxVc = Math.max(maxVc, l.vc)
  return {
    cycleSec: opt.cycleSec,
    avgDelay: an.avgDelay,
    maxVc,
    avgVc: an.avgVc,
    los: an.losFinal,
    Y: opt.Y,
  }
}

export function scanCycleSensitivity(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts: { minCycle?: number; maxCycle?: number; stepSec?: number } = {},
): CycleScanResult {
  const minCycle = Math.max(40, opts.minCycle ?? 50)
  const maxCycle = Math.max(minCycle + 10, opts.maxCycle ?? 150)
  const stepSec = Math.max(2, opts.stepSec ?? 5)
  const points: CycleScanPoint[] = []
  for (let c = minCycle; c <= maxCycle + 1e-9; c += stepSec) {
    points.push(scoreAtCycle(approaches, flow, signal, Math.round(c)))
  }
  const current = scoreAtCycle(approaches, flow, signal, signal.cycleSec)
  let bestDelay = points[0] ?? current
  let bestVc = points[0] ?? current
  for (const p of points) {
    if (p.avgDelay < bestDelay.avgDelay) bestDelay = p
    if (p.maxVc < bestVc.maxVc) bestVc = p
  }
  return {
    minCycle,
    maxCycle,
    stepSec,
    currentCycle: signal.cycleSec,
    points,
    bestDelay,
    bestVc,
    current,
    honesty: '固定周期按 y 分绿后 evaluate · 非完整 HCM 优化器',
  }
}

/** Apply fixed-cycle greens at chosen C (default best delay). */
export function applyCycleScanBest(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  cycleSec: number,
): SignalScheme {
  const opt = optimizeSignalTiming(approaches, flow, signal, {
    method: 'fixed-cycle',
    fixedCycle: cycleSec,
    targetVc: 0.9,
  })
  return {
    ...signal,
    cycleSec: opt.cycleSec,
    phases: opt.appliedPhases,
  }
}

export function cycleScanMarkdown(projectName: string, r: CycleScanResult): string {
  return [
    `# ${projectName} · 周期 C 敏感性`,
    '',
    `- 当前 C=**${r.currentCycle}s** · 延误 ${r.current.avgDelay.toFixed(1)}s · max v/c ${r.current.maxVc.toFixed(3)}`,
    `- 最小延误 C=**${r.bestDelay.cycleSec}s** · 延误 **${r.bestDelay.avgDelay.toFixed(1)}s** · LOS ${r.bestDelay.los}`,
    `- 最小 max v/c C=**${r.bestVc.cycleSec}s** · max v/c **${r.bestVc.maxVc.toFixed(3)}**`,
    `- 范围 ${r.minCycle}–${r.maxCycle} · 步长 ${r.stepSec}s`,
    '',
    '| C s | 延误s | max v/c | 均 v/c | LOS |',
    '|----:|------:|--------:|-------:|-----|',
    ...r.points
      .filter((_, i) => i % Math.max(1, Math.floor(r.points.length / 20)) === 0)
      .map(
        (p) =>
          `| ${p.cycleSec} | ${p.avgDelay.toFixed(1)} | ${p.maxVc.toFixed(3)} | ${p.avgVc.toFixed(3)} | ${p.los} |`,
      ),
    '',
    `- ${r.honesty}`,
  ].join('\n')
}

export function cycleScanCsv(r: CycleScanResult): string {
  return [
    'cycleSec,avgDelay,maxVc,avgVc,los,Y',
    ...r.points.map(
      (p) =>
        `${p.cycleSec},${p.avgDelay.toFixed(2)},${p.maxVc.toFixed(4)},${p.avgVc.toFixed(4)},${p.los},${p.Y.toFixed(4)}`,
    ),
  ].join('\n')
}
