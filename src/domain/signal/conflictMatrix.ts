import type { Approach, Movement, Phase } from '../types'

export type ConflictCell = {
  aKey: string
  bKey: string
  aLabel: string
  bLabel: string
  level: 'ok' | 'warn' | 'block' | 'same'
  reason: string
}

export type MovementKey = {
  approachId: string
  approachName: string
  bearingDeg: number
  movement: Movement
  label: string
}

const MOVS: Movement[] = ['L', 'T', 'R']

function isOpposing(b1: number, b2: number): boolean {
  const d = Math.abs(((b1 - b2) % 360 + 360) % 360)
  return d > 150 && d < 210
}

function isAdjacent(b1: number, b2: number): boolean {
  const d = Math.min(Math.abs(b1 - b2) % 360, 360 - (Math.abs(b1 - b2) % 360))
  return d > 60 && d < 120
}

export function listMovementKeys(approaches: Approach[]): MovementKey[] {
  const out: MovementKey[] = []
  for (const ap of approaches) {
    for (const m of MOVS) {
      out.push({
        approachId: ap.id,
        approachName: ap.name,
        bearingDeg: ap.bearingDeg,
        movement: m,
        label: `${ap.name.replace('进口', '')}${m}`,
      })
    }
  }
  return out
}

export function classifyPair(a: MovementKey, b: MovementKey): ConflictCell {
  const aKey = `${a.approachId}:${a.movement}`
  const bKey = `${b.approachId}:${b.movement}`
  if (aKey === bKey) {
    return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'same', reason: '自身' }
  }
  if (a.approachId === b.approachId) {
    return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'ok', reason: '同进口' }
  }
  if (isOpposing(a.bearingDeg, b.bearingDeg) && a.movement === 'T' && b.movement === 'T') {
    return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'block', reason: '对向直行' }
  }
  if (isOpposing(a.bearingDeg, b.bearingDeg) && ((a.movement === 'L' && b.movement === 'T') || (a.movement === 'T' && b.movement === 'L'))) {
    return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'warn', reason: '左转对向直行' }
  }
  if (isAdjacent(a.bearingDeg, b.bearingDeg)) {
    if ((a.movement === 'L' && b.movement === 'T') || (a.movement === 'T' && b.movement === 'L') || (a.movement === 'L' && b.movement === 'L')) {
      return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'warn', reason: '交叉冲突' }
    }
  }
  // right turns generally permissive
  if (a.movement === 'R' || b.movement === 'R') {
    return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'ok', reason: '兼容' }
  }
  return { aKey, bKey, aLabel: a.label, bLabel: b.label, level: 'ok', reason: '兼容' }
}

export function buildConflictMatrix(approaches: Approach[]): { keys: MovementKey[]; cells: ConflictCell[][] } {
  const keys = listMovementKeys(approaches)
  const cells = keys.map((a) => keys.map((b) => classifyPair(a, b)))
  return { keys, cells }
}

/** Movements currently green in a phase (for highlighting active conflicts). */
export function phaseActiveKeys(phase: Phase): Set<string> {
  const s = new Set<string>()
  for (const [apId, movs] of Object.entries(phase.releases)) {
    for (const m of movs) s.add(`${apId}:${m}`)
  }
  return s
}
