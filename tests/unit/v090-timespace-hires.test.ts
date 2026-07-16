import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { measureCorridor } from '@/domain/analysis/corridor'
import {
  professionalTimeSpaceSvg,
  timeSpaceReportMarkdown,
  timeSpaceReportCsv,
  buildTimeSpaceModel,
} from '@/ui/charts/professionalTimeSpace'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.90 hi-res time–space', () => {
  it('builds 1280×720 diagram homologous with measureCorridor', () => {
    const p = createCrossTemplate()
    const band = measureCorridor(p.bandCorridor)
    const m = buildTimeSpaceModel(p.bandCorridor, band)
    expect(m.nodes.length).toBeGreaterThanOrEqual(2)
    expect(m.C).toBeGreaterThan(0)
    const svg = professionalTimeSpaceSvg(p.bandCorridor, band, {
      width: 1280,
      height: 720,
      theme: 'light',
    })
    expect(svg).toContain('干道绿波时距图')
    expect(svg).toContain('1280')
    expect(svg).toContain('b↑')
    expect(svg).not.toContain('试用版')
    expect(svg.length).toBeGreaterThan(3000)
    const md = timeSpaceReportMarkdown(p.name, p.bandCorridor, band)
    expect(md).toContain('绿波时距图简报')
    expect(md).toContain('路段')
    const csv = timeSpaceReportCsv(p.bandCorridor, band)
    expect(csv).toContain('distanceM')
    expect(csv).toContain('travelSec')
  })

  it('BandPage + export catalog wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('timespace-hires-svg')
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('timespace-report-md')
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('professionalTimeSpaceSvg')
    expect(bp).toContain('高分辨率 SVG')
    expect(bp).toContain('hiResTimeSpace')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('timespace-hires-svg')
  })
})
