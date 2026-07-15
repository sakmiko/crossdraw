import { describe, expect, it } from 'vitest'
import { createCrossTemplate, analyzeIntersection, measureCorridor, optimizeCorridor, applyOffsetsToCorridor } from '@/domain'
import { checkAnalysisIntegrity, analysisChartSeries } from '@/domain/analysis/integrity'

describe('v0.5.15 locks and integrity', () => {
  it('analysis summary matches lane recompute', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const r = analyzeIntersection(ch.approaches, fl, fl.signalSchemes[0])
    const integ = checkAnalysisIntegrity(r)
    expect(integ.ok).toBe(true)
    const series = analysisChartSeries(r)
    expect(series.summary.avgVc).toBe(r.avgVc)
    expect(series.delayBars.length).toBeGreaterThan(0)
    expect(series.delayBars[0].value).toBe(r.lanes[0].delaySec)
  })

  it('locked offset survives optimize and measure uses actual offsets', () => {
    const p = createCrossTemplate()
    const c0 = p.bandCorridor
    // lock second node to a distinctive offset
    c0.nodes[1] = { ...c0.nodes[1], offsetSec: 12.5, lockedOffset: true }
    const result = optimizeCorridor(c0)
    const applied = applyOffsetsToCorridor(c0, result)
    expect(applied.nodes[1].offsetSec).toBe(12.5)
    // unlocked nodes should get optimizer values (may equal 12.5 by chance; check lock flag still)
    expect(applied.nodes[1].lockedOffset).toBe(true)
    const measured = measureCorridor(applied)
    expect(measured.offsets.find((o) => o.id === c0.nodes[1].id)?.offsetSec).toBe(12.5)
    expect(measured.forwardBandwidthSec ?? 0).toBeGreaterThanOrEqual(0)
  })
})
