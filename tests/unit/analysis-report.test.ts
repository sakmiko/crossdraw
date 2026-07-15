import { describe, expect, it } from 'vitest'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'
import { flowMovementDiagramSvg } from '@/ui/charts/professionalDiagrams'

describe('analysis report board', () => {
  it('builds composite svg', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const analysis = analyzeIntersection(ch.approaches, fl, sg)
    const svg = buildAnalysisReportSvg({
      projectName: p.name,
      channelName: ch.name,
      signalName: sg.name,
      approaches: ch.approaches,
      flow: fl,
      signal: sg,
      analysis,
      theme: 'dark',
    })
    expect(svg).toContain('分析报告拼图')
    expect(svg).toContain('流量流向图')
    expect(svg).toContain('v/c')
    expect(svg.length).toBeGreaterThan(2000)
  })

  it('flow diagram includes total and legend', () => {
    const svg = flowMovementDiagramSvg([
      { name: '北', bearingDeg: 0, L: 100, T: 400, R: 80 },
      { name: '南', bearingDeg: 180, L: 90, T: 350, R: 70 },
    ])
    expect(svg).toContain('Σ =')
    expect(svg).toContain('直行')
  })
})
