/**
 * Release matrix alignment: editor L/T/R toggles ↔ control matrix cells.
 * Cell text is canonical sorted movements joined by '·' (same as controlMatrixSvg).
 */
import type { Approach, Movement, Phase, SignalScheme } from '../types'

export type ReleaseCell = {
  phaseId: string
  phaseName: string
  approachId: string
  approachName: string
  movements: Movement[]
  /** display label in matrix */
  label: string
  active: boolean
}

export type ReleaseMatrixAlignment = {
  approachIds: string[]
  approachNames: string[]
  phaseIds: string[]
  phaseNames: string[]
  /** rows = approaches, cols = phases */
  cells: ReleaseCell[][]
  activeCount: number
  totalCells: number
}

const MOV_ORDER: Movement[] = ['L', 'T', 'R', 'U']

export function normalizeMovements(movs: string[] | undefined): Movement[] {
  const set = new Set((movs ?? []).filter((m): m is Movement => MOV_ORDER.includes(m as Movement)))
  return MOV_ORDER.filter((m) => set.has(m))
}

export function releaseLabel(movs: string[] | undefined): string {
  const n = normalizeMovements(movs)
  return n.length ? n.join('·') : '—'
}

export function buildReleaseMatrix(
  signal: SignalScheme,
  approaches: Approach[],
): ReleaseMatrixAlignment {
  const phaseIds = signal.phases.map((p) => p.id)
  const phaseNames = signal.phases.map((p) => p.name)
  const approachIds = approaches.map((a) => a.id)
  const approachNames = approaches.map((a) => a.name.replace('进口', ''))
  const cells: ReleaseCell[][] = approaches.map((ap) =>
    signal.phases.map((ph) => {
      const movements = normalizeMovements(ph.releases[ap.id])
      return {
        phaseId: ph.id,
        phaseName: ph.name,
        approachId: ap.id,
        approachName: ap.name,
        movements,
        label: movements.length ? movements.join('·') : '—',
        active: movements.length > 0,
      }
    }),
  )
  const flat = cells.flat()
  return {
    approachIds,
    approachNames,
    phaseIds,
    phaseNames,
    cells,
    activeCount: flat.filter((c) => c.active).length,
    totalCells: flat.length,
  }
}

/** Compare matrix labels to raw phase.releases for every approach×phase */
export function releaseMatrixAlignsWithPhases(
  signal: SignalScheme,
  approaches: Approach[],
): { ok: boolean; mismatches: string[] } {
  const matrix = buildReleaseMatrix(signal, approaches)
  const mismatches: string[] = []
  for (let i = 0; i < approaches.length; i++) {
    for (let j = 0; j < signal.phases.length; j++) {
      const cell = matrix.cells[i][j]
      const raw = releaseLabel(signal.phases[j].releases[approaches[i].id])
      if (cell.label !== raw) {
        mismatches.push(`${signal.phases[j].name}×${approaches[i].name}: matrix=${cell.label} raw=${raw}`)
      }
      // button state: each L/T/R on iff in movements
      for (const m of MOV_ORDER) {
        if (m === 'U') continue
        const on = (signal.phases[j].releases[approaches[i].id] ?? []).includes(m)
        const inCell = cell.movements.includes(m)
        if (on !== inCell) {
          mismatches.push(`${signal.phases[j].name}×${approaches[i].name}×${m}: button=${on} cell=${inCell}`)
        }
      }
    }
  }
  return { ok: mismatches.length === 0, mismatches }
}

/** Payload for controlMatrixSvg — single source with editor */
export function controlMatrixChartInput(signal: SignalScheme, approaches: Approach[]) {
  const m = buildReleaseMatrix(signal, approaches)
  return {
    approaches: m.approachNames,
    approachIds: m.approachIds,
    phases: signal.phases.map((p, j) => ({
      name: p.name,
      // rebuild releases from normalized cells so chart cannot drift
      releases: Object.fromEntries(
        approaches.map((ap, i) => [ap.id, m.cells[i][j].movements as string[]]),
      ),
    })),
  }
}

export function phaseHasMovement(phase: Phase, approachId: string, m: Movement): boolean {
  return normalizeMovements(phase.releases[approachId]).includes(m)
}
