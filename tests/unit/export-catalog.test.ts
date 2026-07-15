import { describe, expect, it } from 'vitest'
import {
  EXPORT_CATALOG,
  isExportAvailable,
  CATEGORY_LABEL,
  exportIntegrityNotes,
} from '@/io/exportCatalog'

const base = {
  hasChannel: true,
  hasFlow: true,
  hasSignal: true,
  hasAnalysis: true,
  hasSelected: false,
  hasBand: false,
}

describe('export catalog', () => {
  it('has hierarchical categories', () => {
    expect(EXPORT_CATALOG.length).toBeGreaterThan(10)
    const cats = new Set(EXPORT_CATALOG.map((i) => i.category))
    expect(cats.has('drawing')).toBe(true)
    expect(cats.has('analysis')).toBe(true)
    expect(Object.keys(CATEGORY_LABEL).length).toBeGreaterThanOrEqual(5)
  })

  it('gates by context and integrity', () => {
    const board = EXPORT_CATALOG.find((i) => i.id === 'analysis-board')!
    expect(isExportAvailable(board, { ...base, analysisOk: true })).toBe(true)
    expect(isExportAvailable(board, { ...base, hasAnalysis: false })).toBe(false)
    expect(isExportAvailable(board, { ...base, analysisOk: false })).toBe(false)

    const timing = EXPORT_CATALOG.find((i) => i.id === 'timing-svg')!
    expect(isExportAvailable(timing, { ...base, timingClosed: true })).toBe(true)
    expect(isExportAvailable(timing, { ...base, timingClosed: false })).toBe(false)

    const flow = EXPORT_CATALOG.find((i) => i.id === 'flow-dir-svg')!
    expect(isExportAvailable(flow, { ...base, flowAligned: false })).toBe(false)
    expect(isExportAvailable(flow, { ...base, flowAligned: true })).toBe(true)
  })

  it('integrity notes summarize state', () => {
    const bad = exportIntegrityNotes({
      ...base,
      timingClosed: false,
      flowAligned: false,
      analysisOk: false,
    })
    expect(bad.some((n) => n.includes('配时'))).toBe(true)
    const good = exportIntegrityNotes({
      ...base,
      timingClosed: true,
      flowAligned: true,
      analysisOk: true,
    })
    expect(good[0]).toContain('正常')
  })
})
