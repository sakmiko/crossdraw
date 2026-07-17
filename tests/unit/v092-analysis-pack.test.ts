import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  professionalAnalysisPlanPackSvg,
  analysisPlanPackMarkdown,
  analysisPlanPackCsv,
} from '@/ui/charts/professionalAnalysisPlanPack'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.92 analysis plan pack', () => {
  it('builds 2×2 pack with lane table', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const a = analyzeIntersection(ch.approaches, fl, sg)
    const svg = professionalAnalysisPlanPackSvg(ch.approaches, a, {
      cellSize: 400,
      projectName: p.name,
      channelName: ch.name,
      signalName: sg.name,
    })
    expect(svg).toContain('交叉口评价平面图合集')
    expect(svg).toContain('服务水平')
    expect(svg).toContain('延误时间')
    expect(svg).toContain('排队长度')
    expect(svg).toContain('饱和度')
    expect(svg).toContain('车道组评价明细')
    expect(svg).not.toContain('试用版')
    expect(svg.length).toBeGreaterThan(4000)
    const md = analysisPlanPackMarkdown(p.name, a, { channel: ch.name, signal: sg.name })
    expect(md).toContain('评价平面图合集')
    expect(md).toContain('LOS')
    const csv = analysisPlanPackCsv(a)
    expect(csv).toContain('volumePeak')
  })

  it('export + AnalysisWorkspace wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('analysis-plan-pack-svg')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('A4 工程拼版')
    expect(aw).toContain('professionalAnalysisPlanPackSvg')
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('analysis-plan-pack-svg')
  })
})
