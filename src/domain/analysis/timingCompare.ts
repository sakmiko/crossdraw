/**
 * Compare timing methods side-by-side (same demand/geometry).
 * Used for "配时方案比选" table + chart — linked to live project data.
 */
import type { Approach, FlowScheme, SignalScheme } from '../types'
import { analyzeIntersection } from './index'
import {
  optimizeSignalTiming,
  type TimingMethod,
  type TimingOptimizeResult,
  TIMING_METHOD_LABELS,
} from './timing'

export type TimingCompareRow = {
  method: TimingMethod
  label: string
  cycleSec: number
  Y: number
  avgVc: number
  avgDelay: number
  avgQueueM: number
  los: string
  notes: string[]
  /** sum of main-phase greens */
  sumGreen: number
}

export function compareTimingMethods(
  approaches: Approach[],
  flow: FlowScheme,
  signal: SignalScheme,
  opts?: {
    methods?: TimingMethod[]
    targetVc?: number
    fixedCycle?: number
    /** when true, every method uses fixedCycle if provided */
    forceFixedCycle?: boolean
  },
): TimingCompareRow[] {
  const methods: TimingMethod[] = opts?.methods ?? ['webster', 'hcm-delay', 'equal', 'fixed-cycle']
  const fixed = opts?.fixedCycle && opts.fixedCycle > 0 ? opts.fixedCycle : signal.cycleSec
  const rows: TimingCompareRow[] = []

  for (const method of methods) {
    const useFixed = method === 'fixed-cycle' || opts?.forceFixedCycle
    let r: TimingOptimizeResult
    try {
      r = optimizeSignalTiming(approaches, flow, signal, {
        method,
        targetVc: opts?.targetVc ?? 0.9,
        startLoss: signal.startLossSec,
        fixedCycle: useFixed ? fixed : method === 'equal' ? fixed : undefined,
      })
    } catch {
      continue
    }
    const trial: SignalScheme = {
      ...signal,
      cycleSec: r.cycleSec,
      phases: r.appliedPhases,
    }
    const a = analyzeIntersection(approaches, flow, trial)
    const sumGreen = r.appliedPhases.filter((p) => !p.isOverlap).reduce((s, p) => s + p.greenSec, 0)
    rows.push({
      method,
      label: TIMING_METHOD_LABELS[method],
      cycleSec: r.cycleSec,
      Y: r.Y,
      avgVc: a.avgVc,
      avgDelay: a.avgDelay,
      avgQueueM: a.avgQueueM,
      los: a.losFinal,
      notes: r.notes,
      sumGreen,
    })
  }
  return rows
}

/** Pick recommended row: lowest delay among v/c <= 1.05, else lowest v/c */
export function recommendTimingRow(rows: TimingCompareRow[]): TimingCompareRow | null {
  if (!rows.length) return null
  const ok = rows.filter((r) => r.avgVc <= 1.05)
  const pool = ok.length ? ok : rows
  return pool.slice().sort((a, b) => a.avgDelay - b.avgDelay || a.avgVc - b.avgVc)[0] ?? null
}
