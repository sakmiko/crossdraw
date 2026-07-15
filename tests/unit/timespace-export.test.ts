import { describe, expect, it } from 'vitest'
import { createCrossTemplate, optimizeCorridor } from '@/domain'
import { buildTimeSpaceExportSvg } from '@/ui/charts/InteractiveTimeSpace'

describe('timespace export', () => {
  it('builds svg with bandwidth labels', () => {
    const p = createCrossTemplate()
    const result = optimizeCorridor(p.bandCorridor)
    const svg = buildTimeSpaceExportSvg(p.bandCorridor, result, 'dark')
    expect(svg).toContain('<svg')
    expect(svg).toContain('上行')
    expect(svg).toContain('时距图')
    expect(svg.length).toBeGreaterThan(500)
  })
})
