/**
 * Lane-group helpers — keep LaneGroup[] in sync with entry lanes,
 * support variable-lane flag and shared movements for grouped lanes.
 */
import { newId } from '@/shared/id'
import type { Approach, Lane, LaneGroup, Movement } from '../types'

const ORDER: Movement[] = ['U', 'L', 'T', 'R']

export function normalizeLaneMovements(movs: Movement[]): Movement[] {
  const set = new Set(movs)
  const out = ORDER.filter((m) => set.has(m))
  return out.length ? out : (['T'] as Movement[])
}

/** One lane-group per entry lane (default RoadGee-like). */
export function rebuildLaneGroupsFromLanes(ap: Approach): LaneGroup[] {
  return ap.entryLanes.map((ln) => ({
    id: newId(),
    laneIds: [ln.id],
    movements: normalizeLaneMovements([...ln.movements]),
  }))
}

/** After editing a lane, refresh the group that contains it. */
export function syncLaneGroupsForLane(ap: Approach, laneId: string): void {
  const ln = ap.entryLanes.find((l) => l.id === laneId)
  if (!ln) return
  let g = ap.laneGroups.find((x) => x.laneIds.includes(laneId))
  if (!g) {
    g = { id: newId(), laneIds: [laneId], movements: normalizeLaneMovements([...ln.movements]) }
    ap.laneGroups.push(g)
    return
  }
  // if group is singleton, mirror lane; if multi, set group movements from first lane
  if (g.laneIds.length === 1) {
    g.movements = normalizeLaneMovements([...ln.movements])
  } else {
    // push lane movements into group if empty
    if (!g.movements.length) g.movements = normalizeLaneMovements([...ln.movements])
    // keep all member lanes sharing group movements when not variable
    for (const id of g.laneIds) {
      const member = ap.entryLanes.find((l) => l.id === id)
      if (member && !member.variable) member.movements = [...g.movements]
    }
  }
}

export function setLaneVariable(ap: Approach, laneIndex: number, variable: boolean): void {
  const ln = ap.entryLanes[laneIndex]
  if (!ln) return
  ln.variable = variable
  if (variable && ln.movements.length < 2) {
    // default variable = T+L shared
    ln.movements = normalizeLaneMovements(['L', 'T'])
  }
  syncLaneGroupsForLane(ap, ln.id)
}

export function setGroupMovements(ap: Approach, groupId: string, movements: Movement[]): void {
  const g = ap.laneGroups.find((x) => x.id === groupId)
  if (!g) return
  g.movements = normalizeLaneMovements(movements)
  for (const id of g.laneIds) {
    const ln = ap.entryLanes.find((l) => l.id === id)
    if (ln && !ln.variable) ln.movements = [...g.movements]
  }
}

/** Merge two adjacent singleton groups into one shared lane-group. */
export function mergeAdjacentLaneGroups(ap: Approach, laneIndexA: number, laneIndexB: number): boolean {
  const a = ap.entryLanes[laneIndexA]
  const b = ap.entryLanes[laneIndexB]
  if (!a || !b) return false
  const ga = ap.laneGroups.find((g) => g.laneIds.includes(a.id))
  const gb = ap.laneGroups.find((g) => g.laneIds.includes(b.id))
  if (!ga || !gb) return false
  if (ga.id === gb.id) return true
  const movs = normalizeLaneMovements([...ga.movements, ...gb.movements, ...a.movements, ...b.movements])
  ga.laneIds = Array.from(new Set([...ga.laneIds, ...gb.laneIds]))
  ga.movements = movs
  ap.laneGroups = ap.laneGroups.filter((g) => g.id !== gb.id)
  for (const id of ga.laneIds) {
    const ln = ap.entryLanes.find((l) => l.id === id)
    if (ln && !ln.variable) ln.movements = [...movs]
  }
  return true
}

export function splitLaneGroup(ap: Approach, groupId: string): void {
  const g = ap.laneGroups.find((x) => x.id === groupId)
  if (!g || g.laneIds.length <= 1) return
  const keep = g.laneIds[0]
  const rest = g.laneIds.slice(1)
  g.laneIds = [keep]
  for (const id of rest) {
    const ln = ap.entryLanes.find((l) => l.id === id)
    ap.laneGroups.push({
      id: newId(),
      laneIds: [id],
      movements: normalizeLaneMovements([...(ln?.movements ?? g.movements)]),
    })
  }
}

export function laneMovementLabel(ln: Lane): string {
  const base = normalizeLaneMovements(ln.movements).join('') || 'T'
  return ln.variable ? `${base}·变` : base
}

export function countVariableLanes(ap: Approach): number {
  return ap.entryLanes.filter((l) => l.variable).length
}
