import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh, analyzeIntersection } from '@/domain'
import { losGaugeSvg } from '@/ui/charts/svgCharts'
import { losLegendSvg, LOS_DELAY_THRESHOLDS } from '@/ui/charts/losLegend'
import { losByControlDelay } from '@/ui/charts/chartStandards'
import { CHART_REGISTRY, chartsForMode, chartByExportId } from '@/ui/charts/chartRegistry'

describe('v0.5.21 channel drawing sheet', () => {
  it('has CAD legend title block and dual scale labels', () => {
    const p = createCrossTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.labels.some((l) => l.text.includes('图') && l.text.includes('例'))).toBe(true)
    expect(mesh.labels.some((l) => l.text === 'CROSSDRAW')).toBe(true)
    expect(mesh.labels.some((l) => l.text.includes('交叉口渠化'))).toBe(true)
    expect(mesh.labels.some((l) => l.text === '0')).toBe(true)
    expect(mesh.labels.some((l) => l.text === '25' || l.text === '50m')).toBe(true)
    expect(mesh.polylines.some((l) => l.layer === 'FRAME')).toBe(true)
  })
})

describe('v0.5.22 LOS legend alignment', () => {
  it('thresholds match losByControlDelay', () => {
    expect(LOS_DELAY_THRESHOLDS).toHaveLength(6)
    expect(losByControlDelay(10)).toBe('A')
    expect(losByControlDelay(10.01)).toBe('B')
    expect(losByControlDelay(80)).toBe('E')
    expect(losByControlDelay(80.01)).toBe('F')
  })

  it('gauge delegates and marks consistent delay', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const r = analyzeIntersection(ch.approaches, fl, fl.signalSchemes[0])
    const svg = losGaugeSvg(r.losFinal, r.avgDelay)
    expect(svg).toContain('HCM')
    expect(svg).toContain(r.losFinal)
    expect(losLegendSvg('C', 30)).toContain('与阈值一致')
  })
})

describe('v0.5.23 chart registry', () => {
  it('lists charts per mode and export mapping', () => {
    expect(CHART_REGISTRY.length).toBeGreaterThanOrEqual(10)
    expect(chartsForMode('signal').some((c) => c.id === 'signal-timing')).toBe(true)
    expect(chartsForMode('band').some((c) => c.id === 'band-timespace')).toBe(true)
    expect(chartByExportId('timing-svg')?.id).toBe('signal-timing')
    expect(chartByExportId('analysis-board')?.id).toBe('analysis-board')
  })
})
