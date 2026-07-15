/**
 * Flow table ↔ flow charts alignment.
 * Editor table stores natural veh/h; charts must use the same numbers
 * unless explicitly switched to peak pcu (after heavy/PHF).
 */
import type { Approach, FlowScheme, TurnVolumes } from '../types'
import { convertVolumes } from '../flow/convert'

export type FlowDisplayMode = 'natural' | 'peak'

export type FlowApproachRow = {
  approachId: string
  approachName: string
  bearingDeg: number
  L: number
  T: number
  R: number
  U: number
  sumLTR: number
  /** values used for diagrams */
  chartL: number
  chartT: number
  chartR: number
  naturalSum: number
  peakSum: number
}

export type FlowAlignment = {
  mode: FlowDisplayMode
  unit: string
  rows: FlowApproachRow[]
  totalLTR: number
  totalPeakLTR: number
  heavyRatio: number
  phf: number
  /** chart input for flowMovementDiagramSvg */
  diagramData: { name: string; bearingDeg: number; L: number; T: number; R: number }[]
  /** grouped bar input */
  barGroups: {
    group: string
    items: { key: string; value: number; color: string }[]
  }[]
}

const COLORS = { L: '#0891b2', T: '#2563eb', R: '#7c3aed' }

function vol(v: TurnVolumes | undefined): TurnVolumes {
  return {
    U: num(v?.U),
    L: num(v?.L),
    T: num(v?.T),
    R: num(v?.R),
  }
}

function num(x: number | undefined): number {
  return Number.isFinite(x) ? (x as number) : 0
}

export function buildFlowAlignment(
  approaches: Approach[],
  flow: FlowScheme,
  mode: FlowDisplayMode = 'natural',
): FlowAlignment {
  const peaks = convertVolumes(
    flow,
    approaches.map((a) => a.id),
  )
  const peakMap = new Map(peaks.map((p) => [p.approachId, p]))

  const rows: FlowApproachRow[] = approaches.map((ap) => {
    const natural = vol(flow.volumes[ap.id])
    const peak = peakMap.get(ap.id)?.peak ?? natural
    const use = mode === 'peak' ? peak : natural
    const sumLTR = natural.L + natural.T + natural.R
    const peakSum = peak.L + peak.T + peak.R
    return {
      approachId: ap.id,
      approachName: ap.name,
      bearingDeg: ap.bearingDeg,
      L: natural.L,
      T: natural.T,
      R: natural.R,
      U: natural.U,
      sumLTR,
      chartL: use.L,
      chartT: use.T,
      chartR: use.R,
      naturalSum: sumLTR,
      peakSum,
    }
  })

  const totalLTR = rows.reduce((s, r) => s + r.sumLTR, 0)
  const totalPeakLTR = rows.reduce((s, r) => s + r.peakSum, 0)

  const diagramData = rows.map((r) => ({
    name: r.approachName.replace('进口', ''),
    bearingDeg: r.bearingDeg,
    L: r.chartL,
    T: r.chartT,
    R: r.chartR,
  }))

  const barGroups = rows.map((r) => ({
    group: r.approachName.replace('进口', ''),
    items: [
      { key: 'L', value: r.chartL, color: COLORS.L },
      { key: 'T', value: r.chartT, color: COLORS.T },
      { key: 'R', value: r.chartR, color: COLORS.R },
    ],
  }))

  return {
    mode,
    unit: mode === 'peak' ? 'pcu/h (高峰)' : 'veh/h (自然)',
    rows,
    totalLTR,
    totalPeakLTR,
    heavyRatio: flow.heavyRatio,
    phf: flow.phf,
    diagramData,
    barGroups,
  }
}

/** Verify diagram numbers equal table natural L/T/R when mode=natural */
export function flowChartsAlignWithTable(
  approaches: Approach[],
  flow: FlowScheme,
  mode: FlowDisplayMode = 'natural',
  eps = 1e-9,
): { ok: boolean; mismatches: string[] } {
  const a = buildFlowAlignment(approaches, flow, mode)
  const mismatches: string[] = []
  for (const r of a.rows) {
    const table = vol(flow.volumes[r.approachId])
    if (mode === 'natural') {
      if (Math.abs(r.chartL - table.L) > eps) mismatches.push(`${r.approachName} L`)
      if (Math.abs(r.chartT - table.T) > eps) mismatches.push(`${r.approachName} T`)
      if (Math.abs(r.chartR - table.R) > eps) mismatches.push(`${r.approachName} R`)
    } else {
      // peak: chart must match convertVolumes peak
      const peak = convertVolumes(flow, [r.approachId])[0]?.peak
      if (!peak) continue
      if (Math.abs(r.chartL - peak.L) > eps) mismatches.push(`${r.approachName} peakL`)
      if (Math.abs(r.chartT - peak.T) > eps) mismatches.push(`${r.approachName} peakT`)
      if (Math.abs(r.chartR - peak.R) > eps) mismatches.push(`${r.approachName} peakR`)
    }
    // diagramData vs row
    const d = a.diagramData.find((x) => x.name === r.approachName.replace('进口', ''))
    if (d) {
      if (Math.abs(d.L - r.chartL) > eps || Math.abs(d.T - r.chartT) > eps || Math.abs(d.R - r.chartR) > eps) {
        mismatches.push(`${r.approachName} diagram≠row`)
      }
    }
  }
  return { ok: mismatches.length === 0, mismatches }
}
