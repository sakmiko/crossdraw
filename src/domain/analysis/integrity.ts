/**
 * Guard: analysis summary fields must equal recompute from lanes (同源).
 * Averages are volume-weighted — same as analyzeIntersection.
 */
import type { AnalysisResult } from '../types'

export type AnalysisIntegrity = {
  ok: boolean
  avgVc: number
  avgDelay: number
  avgQueueM: number
  recomputedVc: number
  recomputedDelay: number
  recomputedQueue: number
  deltaVc: number
  deltaDelay: number
  deltaQueue: number
  weighting: 'volume'
}

export function checkAnalysisIntegrity(r: AnalysisResult, eps = 1e-9): AnalysisIntegrity {
  const wsum = r.lanes.reduce((s, l) => s + l.volumePeak, 0) || 1
  const recomputedVc = r.lanes.reduce((s, l) => s + l.vc * l.volumePeak, 0) / wsum
  const recomputedDelay = r.lanes.reduce((s, l) => s + l.delaySec * l.volumePeak, 0) / wsum
  const recomputedQueue = r.lanes.reduce((s, l) => s + l.queueM * l.volumePeak, 0) / wsum
  const deltaVc = Math.abs(recomputedVc - r.avgVc)
  const deltaDelay = Math.abs(recomputedDelay - r.avgDelay)
  const deltaQueue = Math.abs(recomputedQueue - r.avgQueueM)
  return {
    ok: deltaVc <= eps && deltaDelay <= eps && deltaQueue <= eps,
    avgVc: r.avgVc,
    avgDelay: r.avgDelay,
    avgQueueM: r.avgQueueM,
    recomputedVc,
    recomputedDelay,
    recomputedQueue,
    deltaVc,
    deltaDelay,
    deltaQueue,
    weighting: 'volume',
  }
}

/** Chart series built only from analysis.lanes — same source as table rows */
export function analysisChartSeries(r: AnalysisResult) {
  const byAp = new Map<string, { name: string; sum: number; n: number }>()
  for (const l of r.lanes) {
    const cur = byAp.get(l.approachId) ?? { name: l.approachName, sum: 0, n: 0 }
    cur.sum += l.vc
    cur.n += 1
    byAp.set(l.approachId, cur)
  }
  const approachVc = Array.from(byAp.values()).map((v) => ({
    label: v.name.replace('进口', ''),
    value: v.sum / Math.max(1, v.n),
  }))
  const delayBars = r.lanes.slice(0, 12).map((l) => ({
    label: `${l.approachName.replace('进口', '')}${l.movement}`,
    value: l.delaySec,
    vc: l.vc,
    queueM: l.queueM,
    volumePeak: l.volumePeak,
  }))
  return {
    approachVc,
    delayBars,
    summary: {
      avgVc: r.avgVc,
      avgDelay: r.avgDelay,
      avgQueueM: r.avgQueueM,
      los: r.losFinal,
    },
  }
}
