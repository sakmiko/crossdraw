import { describe, expect, it } from 'vitest'
import { EXPORT_CATALOG, isExportAvailable, CATEGORY_LABEL } from '@/io/exportCatalog'

describe('export catalog', () => {
  it('has hierarchical categories', () => {
    expect(EXPORT_CATALOG.length).toBeGreaterThan(10)
    const cats = new Set(EXPORT_CATALOG.map((i) => i.category))
    expect(cats.has('drawing')).toBe(true)
    expect(cats.has('analysis')).toBe(true)
    expect(Object.keys(CATEGORY_LABEL).length).toBeGreaterThanOrEqual(5)
  })

  it('gates by context', () => {
    const board = EXPORT_CATALOG.find((i) => i.id === 'analysis-board')!
    expect(
      isExportAvailable(board, {
        hasChannel: true,
        hasFlow: true,
        hasSignal: true,
        hasAnalysis: true,
        hasSelected: false,
        hasBand: false,
      }),
    ).toBe(true)
    expect(
      isExportAvailable(board, {
        hasChannel: true,
        hasFlow: false,
        hasSignal: true,
        hasAnalysis: true,
        hasSelected: false,
        hasBand: false,
      }),
    ).toBe(false)
  })
})
