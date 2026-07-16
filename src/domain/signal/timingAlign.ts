/**
 * Signal scheme field alignment helpers.
 * Table G/Y/AR/C and timing/ring charts must use the same numbers.
 */
import type { Phase, SignalScheme } from '../types'
import { buildDualRingAlignment, isDualRingEnabled } from './dualRing'

export type PhaseTimingRow = {
  id: string
  name: string
  greenSec: number
  yellowSec: number
  allRedSec: number
  isOverlap: boolean
  /** G+Y+AR for this phase */
  durationSec: number
  /** contributes to cycle sum only if not overlap */
  countsTowardCycle: boolean
}

export type SignalTimingAlignment = {
  cycleSec: number
  rows: PhaseTimingRow[]
  mainSumSec: number
  overlapCount: number
  /** mainSum - cycleSec; 0 ≈ closed (single-ring) or dual-ring stage sum */
  balanceSec: number
  closed: boolean
  /** dual-ring stage sum when enabled */
  dualRingStageSumSec?: number
  dualRingEnabled?: boolean
  chartPhases: {
    name: string
    greenSec: number
    yellowSec: number
    allRedSec: number
    isOverlap?: boolean
  }[]
}

export function buildSignalTimingAlignment(signal: SignalScheme): SignalTimingAlignment {
  const rows: PhaseTimingRow[] = signal.phases.map((p) => {
    const greenSec = num(p.greenSec)
    const yellowSec = num(p.yellowSec)
    const allRedSec = num(p.allRedSec)
    return {
      id: p.id,
      name: p.name,
      greenSec,
      yellowSec,
      allRedSec,
      isOverlap: !!p.isOverlap,
      durationSec: greenSec + yellowSec + allRedSec,
      countsTowardCycle: !p.isOverlap,
    }
  })
  const mainSumSec = rows.filter((r) => r.countsTowardCycle).reduce((s, r) => s + r.durationSec, 0)
  const cycleSec = Math.max(1, num(signal.cycleSec))
  const dual = isDualRingEnabled(signal) ? buildDualRingAlignment(signal) : null
  const balanceSec = dual
    ? Math.round((dual.stageSumSec - cycleSec) * 10) / 10
    : Math.round((mainSumSec - cycleSec) * 10) / 10
  const closed = dual ? dual.closed : Math.abs(balanceSec) < 0.15
  return {
    cycleSec,
    rows,
    mainSumSec,
    overlapCount: rows.filter((r) => r.isOverlap).length,
    balanceSec,
    closed,
    dualRingEnabled: !!dual?.enabled,
    dualRingStageSumSec: dual?.stageSumSec,
    chartPhases: rows.map((r) => ({
      name: r.name,
      greenSec: r.greenSec,
      yellowSec: r.yellowSec,
      allRedSec: r.allRedSec,
      isOverlap: r.isOverlap,
    })),
  }
}

/** True if chart inputs equal table fields within eps */
export function signalChartsAlignWithTable(
  signal: SignalScheme,
  eps = 1e-9,
): { ok: boolean; reasons: string[] } {
  const a = buildSignalTimingAlignment(signal)
  const reasons: string[] = []
  if (a.chartPhases.length !== signal.phases.length) {
    reasons.push('相位数量不一致')
  }
  signal.phases.forEach((p, i) => {
    const c = a.chartPhases[i]
    if (!c) return
    if (c.name !== p.name) reasons.push(`相位名 ${p.id}`)
    if (Math.abs(c.greenSec - num(p.greenSec)) > eps) reasons.push(`G ${p.name}`)
    if (Math.abs(c.yellowSec - num(p.yellowSec)) > eps) reasons.push(`Y ${p.name}`)
    if (Math.abs(c.allRedSec - num(p.allRedSec)) > eps) reasons.push(`AR ${p.name}`)
    if (!!c.isOverlap !== !!p.isOverlap) reasons.push(`Overlap ${p.name}`)
  })
  if (Math.abs(a.cycleSec - num(signal.cycleSec)) > eps) reasons.push('周期 C')
  return { ok: reasons.length === 0, reasons }
}

function num(v: number): number {
  return Number.isFinite(v) ? v : 0
}

export function phaseReleaseLabel(p: Phase, approachId: string): string {
  const movs = [...(p.releases[approachId] ?? [])].sort(
    (a, b) => 'LTRU'.indexOf(a) - 'LTRU'.indexOf(b),
  )
  return movs.length ? movs.join('·') : '—'
}
