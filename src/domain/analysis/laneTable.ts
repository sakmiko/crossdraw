/**
 * Analysis lane table sort/filter — same columns as CSV export.
 */
import type { AnalysisLaneResult, AnalysisResult } from '../types'

/** HCM control-delay LOS — same thresholds as chartStandards / analysis */
function losByControlDelay(d: number): string {
  if (d <= 10) return 'A'
  if (d <= 20) return 'B'
  if (d <= 35) return 'C'
  if (d <= 55) return 'D'
  if (d <= 80) return 'E'
  return 'F'
}

export type AnalysisSortKey =
  | 'approachName'
  | 'movement'
  | 'volumePeak'
  | 'vc'
  | 'delaySec'
  | 'queueM'
  | 'capacity'
  | 'satFlow'
  | 'greenRatio'

export type AnalysisFilter = {
  approach?: string | 'all'
  movement?: string | 'all'
  /** only rows with vc >= threshold */
  minVc?: number
  /** only rows with delay >= threshold */
  minDelay?: number
}

export type AnalysisLaneRow = AnalysisLaneResult & {
  losDelay: string
  losVc: string
  losFinal: string
}

export function laneLosVc(vc: number): string {
  if (vc <= 0.6) return 'A'
  if (vc <= 0.7) return 'B'
  if (vc <= 0.8) return 'C'
  if (vc <= 0.9) return 'D'
  if (vc <= 1.0) return 'E'
  return 'F'
}

export function enrichLaneRows(result: AnalysisResult): AnalysisLaneRow[] {
  return result.lanes.map((l) => {
    const losDelay = losByControlDelay(l.delaySec)
    const losVc = laneLosVc(l.vc)
    // row-level final: prefer delay LOS, elevate if vc worse (same spirit as intersection)
    const order = 'ABCDEF'
    const losFinal =
      order.indexOf(losVc) > order.indexOf(losDelay) && l.vc > 0.85 ? losVc : losDelay
    return { ...l, losDelay, losVc, losFinal }
  })
}

export function filterAnalysisLanes(rows: AnalysisLaneRow[], f: AnalysisFilter): AnalysisLaneRow[] {
  return rows.filter((r) => {
    if (f.approach && f.approach !== 'all' && r.approachName !== f.approach) return false
    if (f.movement && f.movement !== 'all' && r.movement !== f.movement) return false
    if (f.minVc != null && f.minVc > 0 && r.vc < f.minVc) return false
    if (f.minDelay != null && f.minDelay > 0 && r.delaySec < f.minDelay) return false
    return true
  })
}

export function sortAnalysisLanes(
  rows: AnalysisLaneRow[],
  key: AnalysisSortKey,
  dir: 'asc' | 'desc' = 'desc',
): AnalysisLaneRow[] {
  const mul = dir === 'asc' ? 1 : -1
  return rows.slice().sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul
    return String(av).localeCompare(String(bv), 'zh') * mul
  })
}

export function uniqueApproaches(rows: AnalysisLaneRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.approachName)))
}

/** CSV columns aligned with on-screen detail table + capacity fields */
export const ANALYSIS_CSV_HEADER =
  'approach,movement,volume_peak,sat_flow,green_ratio,capacity,vc,delay_s,queue_m,los_delay,los_vc,los_row'

export function analysisLanesToCsvRows(rows: AnalysisLaneRow[]): string[] {
  return rows.map((l) =>
    [
      csv(l.approachName),
      l.movement,
      l.volumePeak.toFixed(2),
      l.satFlow.toFixed(1),
      l.greenRatio.toFixed(3),
      l.capacity.toFixed(1),
      l.vc.toFixed(3),
      l.delaySec.toFixed(2),
      l.queueM.toFixed(2),
      l.losDelay,
      l.losVc,
      l.losFinal,
    ].join(','),
  )
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}
