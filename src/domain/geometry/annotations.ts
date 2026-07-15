/**
 * Channel drawing annotations — lane numbers, stop-line chainage, approach codes.
 * Distances are in mesh meters (same as rebuild).
 */
import type { Approach } from '../types'

/** Entry lane index 1..n from median outward (inside → curb). */
export function entryLaneNumber(indexFromMedian: number): number {
  return indexFromMedian + 1
}

/** Exit lane index 1..n from median outward. */
export function exitLaneNumber(indexFromMedian: number): number {
  return indexFromMedian + 1
}

/** Short approach code for stamps, e.g. 北进口 → N, 东进口 → E */
export function approachCode(ap: Approach): string {
  const n = ap.name
  if (/北|N\b|north/i.test(n) || (ap.bearingDeg >= 315 || ap.bearingDeg < 45)) return 'N'
  if (/东|E\b|east/i.test(n) || (ap.bearingDeg >= 45 && ap.bearingDeg < 135)) return 'E'
  if (/南|S\b|south/i.test(n) || (ap.bearingDeg >= 135 && ap.bearingDeg < 225)) return 'S'
  if (/西|W\b|west/i.test(n) || (ap.bearingDeg >= 225 && ap.bearingDeg < 315)) return 'W'
  return `A${Math.round(ap.bearingDeg)}`
}

/**
 * Stop-line station label: chainage from intersection core (stop line distance).
 * Format: 停车线 K0+xxx.x (m from geometric center along approach).
 */
export function stopLineStationLabel(stopLineDistanceM: number): string {
  const d = Math.max(0, stopLineDistanceM)
  const km = Math.floor(d / 1000)
  const m = d - km * 1000
  const mStr = m.toFixed(1).padStart(5, '0') // e.g. 018.5
  return `停车线 K${km}+${mStr}`
}

/** Compact station for tight labels */
export function stopLineStationShort(stopLineDistanceM: number): string {
  return `SL ${stopLineDistanceM.toFixed(1)}m`
}

export function entryLaneStamp(indexFromMedian: number, movements: string[], variable?: boolean): string {
  const n = entryLaneNumber(indexFromMedian)
  const mov = movements.join('') || 'T'
  return variable ? `E${n}·${mov}·变` : `E${n}·${mov}`
}

export function exitLaneStamp(indexFromMedian: number): string {
  return `X${exitLaneNumber(indexFromMedian)}`
}
