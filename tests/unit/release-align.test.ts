import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import {
  buildReleaseMatrix,
  releaseLabel,
  releaseMatrixAlignsWithPhases,
  controlMatrixChartInput,
  normalizeMovements,
} from '@/domain/signal/releaseAlign'

describe('release matrix alignment v0.5.17', () => {
  it('normalizes movement order L·T·R', () => {
    expect(releaseLabel(['R', 'L', 'T'])).toBe('L·T·R')
    expect(normalizeMovements(['T', 'T', 'L'])).toEqual(['L', 'T'])
    expect(releaseLabel([])).toBe('—')
  })

  it('matrix matches phase releases for template', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const check = releaseMatrixAlignsWithPhases(sg, ch.approaches)
    expect(check.ok).toBe(true)
    const m = buildReleaseMatrix(sg, ch.approaches)
    expect(m.cells.length).toBe(ch.approaches.length)
    expect(m.cells[0].length).toBe(sg.phases.length)
  })

  it('chart input releases equal matrix cells', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    // scramble order in one release
    const ap = ch.approaches[0]
    const ph = sg.phases[0]
    ph.releases[ap.id] = ['R', 'L']
    const input = controlMatrixChartInput(sg, ch.approaches)
    const cell = buildReleaseMatrix(sg, ch.approaches).cells[0][0]
    expect(input.phases[0].releases[ap.id]).toEqual(cell.movements)
    expect(releaseMatrixAlignsWithPhases(sg, ch.approaches).ok).toBe(true)
  })
})
