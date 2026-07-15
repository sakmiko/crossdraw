/**
 * Pedestrian phase helpers — concurrent walk intervals on approach faces.
 */
import type { Approach, Phase, PedestrianCrossing, SignalScheme } from '../types'

export function pedCrossingsOf(phase: Phase): PedestrianCrossing[] {
  return phase.pedestrian ?? []
}

export function phaseHasPed(phase: Phase): boolean {
  return pedCrossingsOf(phase).length > 0
}

export function togglePedCrossing(phase: Phase, approachId: string): Phase {
  const list = [...pedCrossingsOf(phase)]
  const i = list.findIndex((p) => p.approachId === approachId)
  if (i >= 0) list.splice(i, 1)
  else list.push({ approachId, exclusive: false })
  return { ...phase, pedestrian: list }
}

export function setPedExclusive(phase: Phase, approachId: string, exclusive: boolean): Phase {
  const list = pedCrossingsOf(phase).map((p) =>
    p.approachId === approachId ? { ...p, exclusive } : p,
  )
  return { ...phase, pedestrian: list }
}

export function countPedIntervals(signal: SignalScheme): number {
  return signal.phases.reduce((s, p) => s + pedCrossingsOf(p).length, 0)
}

export function pedSummary(phase: Phase, approaches: Approach[]): string {
  const list = pedCrossingsOf(phase)
  if (!list.length) return '无行人'
  const names = list.map((p) => {
    const ap = approaches.find((a) => a.id === p.approachId)
    const tag = p.exclusive ? '独' : '共'
    return `${ap?.name?.replace('进口', '') ?? p.approachId}(${tag})`
  })
  return names.join(' · ')
}

/** Walk/FDW split inside green; defaults 0.6 / 0.4 of green when unset. */
export function pedWalkFdw(phase: Phase): { walk: number; fdw: number } {
  const g = Math.max(0, phase.greenSec)
  if (phase.pedWalkSec != null || phase.pedFdwSec != null) {
    const walk = phase.pedWalkSec ?? Math.max(0, g - (phase.pedFdwSec ?? 0))
    const fdw = phase.pedFdwSec ?? Math.max(0, g - walk)
    return { walk, fdw }
  }
  return { walk: g * 0.6, fdw: g * 0.4 }
}
