/**
 * Approach widen geometry — entry/exit bay length & taper aligned to WidenParams.
 * Distances along approach axis from stop line (core) outward.
 */
import type { Approach, WidenParams } from '../types'

export type WidenProfile = {
  entryExtraM: number
  exitExtraM: number
  entryBayM: number
  entryTaperM: number
  exitBayM: number
  exitTaperM: number
  /** station from stop line: full widen ends, taper ends, approach end */
  stations: {
    entryFullEnd: number
    entryTaperEnd: number
    exitFullStart: number
    exitTaperStart: number
  }
}

/** Full lateral extra at stop line for entry widen (m). Count × width, no fudge. */
export function entryWidenExtraM(w: WidenParams): number {
  if (w.entryWidenCount <= 0) return 0
  return Math.max(0, w.entryWidenCount * Math.max(0, w.entryWidenWidthM))
}

export function exitWidenExtraM(w: WidenParams): number {
  if (w.exitWidenCount <= 0) return 0
  return Math.max(0, w.exitWidenCount * Math.max(0, w.exitWidenWidthM))
}

export function buildWidenProfile(ap: Approach, approachLenM: number): WidenProfile {
  const w = ap.widen
  const entryExtraM = entryWidenExtraM(w)
  const exitExtraM = exitWidenExtraM(w)
  const entryBayM = Math.max(0, w.entryWidenLengthM)
  const entryTaperM = Math.max(0, w.entryTaperM)
  const exitBayM = Math.max(0, w.exitWidenLengthM)
  const exitTaperM = Math.max(0, w.exitTaperM)

  const entryFullEnd = entryBayM
  const entryTaperEnd = entryBayM + entryTaperM
  // exit widen near far end of drawn approach stub (optional visual)
  const exitFullStart = Math.max(entryTaperEnd + 5, approachLenM - exitBayM - exitTaperM)
  const exitTaperStart = Math.max(exitFullStart, approachLenM - exitTaperM)

  return {
    entryExtraM,
    exitExtraM,
    entryBayM,
    entryTaperM,
    exitBayM,
    exitTaperM,
    stations: {
      entryFullEnd,
      entryTaperEnd,
      exitFullStart,
      exitTaperStart,
    },
  }
}

/**
 * Lateral offset (extra width outside base half-width) on the entry side
 * at station s (m from stop line along approach).
 * Entry widen is applied to the curb side of entry lanes (negative px in rebuild).
 */
export function entryLateralExtraAt(profile: WidenProfile, s: number): number {
  const { entryExtraM, stations } = profile
  if (entryExtraM <= 0) return 0
  if (s <= stations.entryFullEnd) return entryExtraM
  if (s >= stations.entryTaperEnd) return 0
  const span = stations.entryTaperEnd - stations.entryFullEnd
  if (span <= 1e-6) return 0
  const t = (s - stations.entryFullEnd) / span
  return entryExtraM * (1 - t)
}

export function exitLateralExtraAt(profile: WidenProfile, s: number, approachLenM: number): number {
  const { exitExtraM, stations } = profile
  if (exitExtraM <= 0) return 0
  if (s >= approachLenM - 1e-6) return exitExtraM
  if (s <= stations.exitFullStart) return 0
  // from exitFullStart to end: full then optional reverse not used — keep full on far stub
  if (s >= stations.exitTaperStart) {
    const span = approachLenM - stations.exitTaperStart
    if (span <= 1e-6) return exitExtraM
    const t = (s - stations.exitTaperStart) / span
    return exitExtraM * t
  }
  return exitExtraM
}

export function widenAnnotation(ap: Approach): string | null {
  const e = entryWidenExtraM(ap.widen)
  if (e <= 0) return null
  return `进口展宽 ${ap.widen.entryWidenCount}×${ap.widen.entryWidenWidthM}m · 段长${ap.widen.entryWidenLengthM}m · 渐变${ap.widen.entryTaperM}m · 加宽${e.toFixed(1)}m`
}
