import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EXPORT_CATALOG, isExportAvailable } from '@/io/exportCatalog'

describe('v0.5.131 DESIGN + interactive signal + export hygiene', () => {
  it('DESIGN tokens present in CSS', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('#0b0f19')
    expect(css).toContain('DESIGN.md')
    expect(css).toContain('.interactive-signal-board')
    expect(css).toContain('left-nav.is-collapsed .left-nav-label')
  })

  it('InteractiveSignalBoard + ModeCenterStage wired', () => {
    const board = readFileSync(resolve('src/ui/charts/InteractiveSignalBoard.tsx'), 'utf8')
    expect(board).toContain('onUpdatePhaseTiming')
    expect(board).toContain('greenSec')
    const mcs = readFileSync(resolve('src/ui/layout/ModeCenterStage.tsx'), 'utf8')
    expect(mcs).toContain('InteractiveSignalBoard')
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('onUpdatePhaseTiming={updatePhaseTiming}')
    expect(app).toMatch(/v0\.5\.\d+/)
  })

  it('export center half-wires fixed', () => {
    for (const id of [
      'intergreen-svg',
      'intergreen-md',
      'intergreen-csv',
      'cycle-scan-svg',
      'cycle-scan-md',
      'cycle-scan-csv',
    ] as const) {
      const item = EXPORT_CATALOG.find((x) => x.id === id)
      expect(item).toBeTruthy()
      expect(
        isExportAvailable(item!, {
          hasChannel: true,
          hasFlow: true,
          hasSignal: true,
          hasAnalysis: true,
          hasSelected: true,
          hasBand: true,
        }),
      ).toBe(true)
    }
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain("'intergreen-svg'")
    expect(app).toContain("'cycle-scan-csv'")
  })
})
