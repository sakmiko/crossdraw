import { describe, expect, it } from 'vitest'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  ANALYSIS_CSV_HEADER,
  analysisLanesToCsvRows,
  enrichLaneRows,
  filterAnalysisLanes,
  sortAnalysisLanes,
} from '@/domain/analysis/laneTable'
import { analysisToCsv } from '@/io/report'

describe('analysis lane table v0.5.33', () => {
  it('enriches and sorts by vc desc', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = analyzeIntersection(ch.approaches, fl, sg)
    const rows = enrichLaneRows(r)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0].losDelay).toMatch(/^[A-F]$/)
    const sorted = sortAnalysisLanes(rows, 'vc', 'desc')
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].vc).toBeGreaterThanOrEqual(sorted[i].vc - 1e-9)
    }
  })

  it('filters by movement and minVc', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const r = analyzeIntersection(ch.approaches, ch.flowSchemes[0], ch.flowSchemes[0].signalSchemes[0])
    const rows = enrichLaneRows(r)
    const onlyT = filterAnalysisLanes(rows, { movement: 'T' })
    expect(onlyT.every((x) => x.movement === 'T')).toBe(true)
    const high = filterAnalysisLanes(rows, { minVc: 0.5 })
    expect(high.every((x) => x.vc >= 0.5)).toBe(true)
  })

  it('csv header matches export helper', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const r = analyzeIntersection(ch.approaches, ch.flowSchemes[0], ch.flowSchemes[0].signalSchemes[0])
    const csv = analysisToCsv(r, { sortKey: 'delaySec', sortDir: 'desc' })
    expect(csv.split('\n')[0]).toBe(ANALYSIS_CSV_HEADER)
    expect(csv).toContain('summary_rows_exported')
    const rows = enrichLaneRows(r)
    expect(analysisLanesToCsvRows(rows)[0].split(',').length).toBe(ANALYSIS_CSV_HEADER.split(',').length)
  })
})
