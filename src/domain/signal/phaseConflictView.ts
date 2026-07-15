/**
 * Phase conflict visualization helpers.
 * Matrix highlight = concurrent greens in selected phase; list = detectPhaseConflicts issues.
 */
import type { Approach, Issue, Phase, SignalScheme } from '../types'
import { detectPhaseConflicts } from './conflicts'
import {
  buildConflictMatrix,
  phaseActiveKeys,
  type ConflictCell,
  type MovementKey,
} from './conflictMatrix'

export type ActiveConflictHit = {
  phaseId: string
  phaseName: string
  aLabel: string
  bLabel: string
  level: 'warn' | 'block'
  reason: string
  aKey: string
  bKey: string
}

export type PhaseConflictReport = {
  keys: MovementKey[]
  cells: ConflictCell[][]
  /** key -> currently green in phase */
  activeKeys: Set<string>
  /** cells that are both active and non-ok */
  activeHits: ActiveConflictHit[]
  issues: Issue[]
  counts: { block: number; warn: number; ok: number }
}

export function buildPhaseConflictReport(
  approaches: Approach[],
  signal: SignalScheme,
  phaseId: string | null,
): PhaseConflictReport {
  const { keys, cells } = buildConflictMatrix(approaches)
  const phase =
    (phaseId ? signal.phases.find((p) => p.id === phaseId) : null) ?? signal.phases[0] ?? null
  const activeKeys = phase ? phaseActiveKeys(phase) : new Set<string>()
  const activeHits: ActiveConflictHit[] = []
  let block = 0
  let warn = 0
  let ok = 0

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const cell = cells[i][j]
      if (cell.level === 'block') block++
      else if (cell.level === 'warn') warn++
      else if (cell.level === 'ok') ok++
      if (!phase) continue
      if (cell.level !== 'block' && cell.level !== 'warn') continue
      const aOn = activeKeys.has(cell.aKey)
      const bOn = activeKeys.has(cell.bKey)
      if (aOn && bOn) {
        activeHits.push({
          phaseId: phase.id,
          phaseName: phase.name,
          aLabel: cell.aLabel,
          bLabel: cell.bLabel,
          level: cell.level,
          reason: cell.reason,
          aKey: cell.aKey,
          bKey: cell.bKey,
        })
      }
    }
  }

  const issues = phase ? detectPhaseConflicts([phase], approaches) : detectPhaseConflicts(signal.phases, approaches)

  return {
    keys,
    cells,
    activeKeys,
    activeHits,
    issues,
    counts: { block, warn, ok },
  }
}

export function allPhasesConflictHits(approaches: Approach[], signal: SignalScheme): ActiveConflictHit[] {
  const hits: ActiveConflictHit[] = []
  for (const ph of signal.phases) {
    if (ph.isOverlap) continue
    const r = buildPhaseConflictReport(approaches, signal, ph.id)
    hits.push(...r.activeHits)
  }
  return hits
}

export function phaseConflictSummaryText(report: PhaseConflictReport): string {
  const live = report.activeHits
  const blocks = live.filter((h) => h.level === 'block').length
  const warns = live.filter((h) => h.level === 'warn').length
  if (!live.length) return '当前相位无同时放行冲突'
  return `当前相位：禁止 ${blocks} · 警告 ${warns}`
}
