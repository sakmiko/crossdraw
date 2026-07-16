/**
 * Live signal / saturation KPIs from current scheme + optional optimized preview.
 * Homology: analyzeIntersection + criticalFlowRatios / optimizeSignalTiming.
 * Refs: Webster 1958; HCM signalized delay/v/c (engineering approx).
 */
import type { Approach, FlowScheme, SignalScheme } from '../types'
import { analyzeIntersection } from '../analysis'
import { optimizeSignalTiming, type TimingMethod } from '../analysis/timing'
import { computeSchemeY } from './autoTimingPack'

export type SaturationKpi = {
  cycleSec: number
  phaseCount: number
  Y: number
  dualRing: boolean
  avgVc: number
  maxVc: number
  avgDelay: number
  avgQueueM: number
  los: string
  criticalApproach: string
  criticalMovement: string
  notes: string[]
  honesty: string
}

export function computeSaturationKpi(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
): SaturationKpi {
  const analysis = analyzeIntersection(approaches, flow, signal)
  const y = computeSchemeY(approaches, flow, signal)
  let maxLane = analysis.lanes[0]
  for (const l of analysis.lanes) {
    if (!maxLane || l.vc > maxLane.vc) maxLane = l
  }
  return {
    cycleSec: signal.cycleSec,
    phaseCount: signal.phases.filter((p) => !p.isOverlap).length,
    Y: y.Y,
    dualRing: y.dualRing,
    avgVc: analysis.avgVc,
    maxVc: maxLane?.vc ?? analysis.avgVc,
    avgDelay: analysis.avgDelay,
    avgQueueM: analysis.avgQueueM,
    los: analysis.losFinal,
    criticalApproach: maxLane?.approachName ?? '—',
    criticalMovement: maxLane?.movement ?? '—',
    notes: y.notes.slice(0, 4),
    honesty: 'v/c·延误同源 analyzeIntersection · Y 为关键流向比（Webster/HCM 工程近似）',
  }
}

export type OptimizePreview = {
  before: SaturationKpi
  after: SaturationKpi
  method: TimingMethod
  cycleSec: number
  notes: string[]
  appliedPhases: SignalScheme['phases']
}

export function previewOptimize(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts: {
    method?: TimingMethod
    targetVc?: number
    startLoss?: number
    fixedCycle?: number
  } = {},
): OptimizePreview {
  const before = computeSaturationKpi(approaches, flow, signal)
  const method = opts.method ?? 'webster'
  const r = optimizeSignalTiming(approaches, flow, signal, {
    method,
    targetVc: opts.targetVc ?? 0.9,
    startLoss: opts.startLoss ?? signal.startLossSec ?? 3,
    fixedCycle: opts.fixedCycle,
  })
  const next: SignalScheme = {
    ...signal,
    cycleSec: r.cycleSec,
    phases: r.appliedPhases,
  }
  const after = computeSaturationKpi(approaches, flow, next)
  return {
    before,
    after,
    method,
    cycleSec: r.cycleSec,
    notes: r.notes,
    appliedPhases: r.appliedPhases,
  }
}

export function saturationKpiMarkdown(name: string, k: SaturationKpi, title = '饱和度与配时 KPI'): string {
  return [
    `# ${name} · ${title}`,
    '',
    `- C=${k.cycleSec}s · 相位 ${k.phaseCount} · Y=${k.Y.toFixed(3)}${k.dualRing ? '（双环）' : ''}`,
    `- 均 v/c ${k.avgVc.toFixed(3)} · 最大 v/c ${k.maxVc.toFixed(3)}（${k.criticalApproach} ${k.criticalMovement}）`,
    `- 均延误 ${k.avgDelay.toFixed(1)} s · 均排队 ${k.avgQueueM.toFixed(1)} m · LOS ${k.los}`,
    `- ${k.honesty}`,
    ...k.notes.map((n) => `- ${n}`),
  ].join('\n')
}

export function optimizeDeltaMarkdown(name: string, p: OptimizePreview): string {
  const dVc = p.after.avgVc - p.before.avgVc
  const dDelay = p.after.avgDelay - p.before.avgDelay
  return [
    `# ${name} · 一键优化预览`,
    '',
    `- 方法 ${p.method} · 优化后 C=${p.cycleSec}s`,
    `- Δ均 v/c ${dVc >= 0 ? '+' : ''}${dVc.toFixed(3)} · Δ延误 ${dDelay >= 0 ? '+' : ''}${dDelay.toFixed(1)}s`,
    '',
    '## 优化前',
    saturationKpiMarkdown(name, p.before, '优化前').replace(/^#.*\n\n/, ''),
    '',
    '## 优化后',
    saturationKpiMarkdown(name, p.after, '优化后').replace(/^#.*\n\n/, ''),
    '',
    '## 算法说明',
    ...p.notes.map((n) => `- ${n}`),
  ].join('\n')
}
