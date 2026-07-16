/**
 * Pedestrian Walk/FDW sizing from crosswalk length (engineering sketch).
 * Not full MUTCD / CJJ automated controller logic.
 */
import type { Approach, Phase, SignalScheme } from '../types'
import { pedWalkFdw } from './pedestrian'

export type PedTimingFace = {
  approachId: string
  approachName: string
  lengthM: number
  walkSec: number
  fdwSec: number
}

/** Roadway width at stop line ≈ crosswalk length. */
export function crosswalkLengthM(ap: Approach): number {
  const entry = ap.entryLanes.reduce((s, l) => s + (l.widthM || 3.25), 0)
  const exit = ap.exitLanes.reduce((s, l) => s + (l.widthM || 3.25), 0)
  const med = Math.max(0, ap.median?.widthM ?? 0)
  const bike = ap.bikeEnabled ? ap.bikeWidthM || 0 : 0
  return Math.max(3.5, entry + med + exit + bike)
}

export function sizeWalkFdw(
  lengthM: number,
  opts: { walkSpeedMps?: number; startupSec?: number; minWalk?: number; minFdw?: number; greenBudget?: number } = {},
): { walkSec: number; fdwSec: number } {
  const v = opts.walkSpeedMps ?? 1.2
  const startup = opts.startupSec ?? 3
  const minWalk = opts.minWalk ?? 7
  const minFdw = opts.minFdw ?? 5
  const clear = lengthM / Math.max(0.5, v)
  let fdw = Math.max(minFdw, Math.ceil(clear))
  let walk = Math.max(minWalk, Math.ceil(startup + 0.35 * clear))
  if (opts.greenBudget != null && walk + fdw > opts.greenBudget) {
    fdw = Math.max(minFdw, Math.min(fdw, Math.floor(opts.greenBudget * 0.45)))
    walk = Math.max(minWalk, opts.greenBudget - fdw)
  }
  return { walkSec: walk, fdwSec: fdw }
}

export function recommendPhasePedTiming(phase: Phase, approaches: Approach[]) {
  const faces: PedTimingFace[] = []
  for (const ped of phase.pedestrian ?? []) {
    const ap = approaches.find((a) => a.id === ped.approachId)
    if (!ap) continue
    const lengthM = crosswalkLengthM(ap)
    const { walkSec, fdwSec } = sizeWalkFdw(lengthM, { greenBudget: phase.greenSec })
    faces.push({ approachId: ap.id, approachName: ap.name, lengthM, walkSec, fdwSec })
  }
  if (!faces.length) {
    const cur = pedWalkFdw(phase)
    return { walkSec: Math.round(cur.walk), fdwSec: Math.round(cur.fdw), faces, notes: ['无行人面'] }
  }
  const walkSec = Math.max(...faces.map((f) => f.walkSec))
  const fdwSec = Math.max(...faces.map((f) => f.fdwSec))
  const ctrl = faces.reduce((a, b) => (b.walkSec + b.fdwSec > a.walkSec + a.fdwSec ? b : a))
  return {
    walkSec,
    fdwSec,
    faces,
    notes: [`控制面 ${ctrl.approachName.replace('进口', '')} L=${ctrl.lengthM.toFixed(1)}m`],
  }
}

export function applyPedTimingToPhase(phase: Phase, approaches: Approach[]): Phase {
  if (!(phase.pedestrian ?? []).length) return phase
  const rec = recommendPhasePedTiming(phase, approaches)
  const need = rec.walkSec + rec.fdwSec
  return {
    ...phase,
    greenSec: Math.max(phase.greenSec, need),
    pedWalkSec: rec.walkSec,
    pedFdwSec: rec.fdwSec,
  }
}

export function applyPedTimingToSignal(signal: SignalScheme, approaches: Approach[]): SignalScheme {
  return {
    ...signal,
    phases: signal.phases.map((ph) => applyPedTimingToPhase(ph, approaches)),
  }
}
