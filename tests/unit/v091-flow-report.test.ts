import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { buildFlowAlignment } from '@/domain/flow/flowAlign'
import {
  professionalFlowReportSvg,
  flowOdReportMarkdown,
  flowOdReportCsv,
} from '@/ui/charts/professionalFlowReport'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.91 flow report pack', () => {
  it('hi-res report embeds OD table and aligns with flowAlign', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const align = buildFlowAlignment(ch.approaches, fl, 'natural')
    const svg = professionalFlowReportSvg(ch.approaches, fl, { size: 900, mode: 'natural' })
    expect(svg).toContain('交叉口流量流向图')
    expect(svg).toContain('OD 分向流量表')
    expect(svg).toContain(String(Math.round(align.totalLTR)))
    expect(svg).not.toContain('试用版')
    expect(svg.length).toBeGreaterThan(2000)
    // change volume → total changes in report
    const ap = ch.approaches[0]
    fl.volumes[ap.id] = { ...fl.volumes[ap.id], T: (fl.volumes[ap.id]?.T ?? 0) + 200 }
    const svg2 = professionalFlowReportSvg(ch.approaches, fl, { size: 900, mode: 'natural' })
    expect(svg2).not.toEqual(svg)
    const md = flowOdReportMarkdown(p.name, ch.approaches, fl, 'natural')
    expect(md).toContain('流量流向 OD')
    const csv = flowOdReportCsv(ch.approaches, fl, 'natural')
    expect(csv).toContain('sumLTR')
  })

  it('export + FlowWorkspace wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('flow-report-hires-svg')
    expect(ids).toContain('flow-od-md')
    expect(ids).toContain('multi-page-report')
    const fw = readFileSync(resolve(__dirname, '../../src/ui/layout/FlowWorkspace.tsx'), 'utf8')
    expect(fw).toMatch(/FlowWorkspace|flowLtr|EChart|流向|导出 PNG/)
    expect(fw).toContain('professionalFlowReportSvg')
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('flow-report-hires-svg')
  })
})
