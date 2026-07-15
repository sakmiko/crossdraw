import { describe, expect, it } from 'vitest'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import { buildAnalysisReportSvg } from '@/io/analysisReportSvg'

describe('report with phase faces', () => {
  it('includes phase face section when phases exist', () => {
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
    })
    expect(svg).toContain('相位灯态')
    expect(svg).toContain('分析报告拼图')
  })
})
