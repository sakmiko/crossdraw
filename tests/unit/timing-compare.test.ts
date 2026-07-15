import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import { compareTimingMethods, recommendTimingRow } from '@/domain/analysis/timingCompare'
import { vcHeatColor } from '@/ui/charts/svgCharts'

describe('timing compare', () => {
  it('compares methods and recommends one', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const rows = compareTimingMethods(ch.approaches, fl, sg, { targetVc: 0.9, fixedCycle: 90 })
    expect(rows.length).toBeGreaterThanOrEqual(3)
    expect(rows.every((r) => r.cycleSec >= 40)).toBe(true)
    const rec = recommendTimingRow(rows)
    expect(rec).not.toBeNull()
    expect(rec!.label.length).toBeGreaterThan(0)
  })
})

describe('vc heat', () => {
  it('returns warmer color for higher vc', () => {
    expect(vcHeatColor(0.3)).toContain('#')
    expect(vcHeatColor(1.2)).toBe('#991b1b')
  })
})
