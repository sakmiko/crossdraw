import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, buildCrossSection } from '@/domain'
import {
  buildSectionReport,
  componentsForDiagram,
  sectionReportCsv,
  sectionReportMarkdown,
} from '@/domain/xsection/report'
import { professionalCrossSectionSvg } from '@/ui/charts/crossSectionDiagram'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.87 xsection report pack', () => {
  it('report includes components and optional aux', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    ap.auxRoad = { enabled: true, widthM: 5.5, offsetM: 1, openNearM: 18 }
    ap.leftWait = true
    const xs = buildCrossSection(ap)
    const rep = buildSectionReport(ap, xs)
    expect(rep.alignOk).toBe(true)
    expect(rep.auxEnabled).toBe(true)
    expect(rep.components.some((c) => c.label === '辅路')).toBe(true)
    expect(rep.totalWidthM).toBeGreaterThan(rep.expectedWidthM - rep.auxWidthM)
    const md = sectionReportMarkdown(p.name, rep)
    expect(md).toContain('横断面')
    expect(md).toContain('辅路')
    const csv = sectionReportCsv(rep)
    expect(csv).toContain('widthM')
    const comps = componentsForDiagram(ap, xs)
    const svg = professionalCrossSectionSvg(xs, ap, {
      theme: 'light',
      componentsOverride: comps,
    })
    expect(svg).toContain('标准横断面')
    expect(svg).toContain('辅路')
    expect(svg).not.toContain('试用版')
  })

  it('export catalog + workspace wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('xsection-report-md')
    expect(ids).toContain('xsection-report-csv')
    const ws = readFileSync(resolve(__dirname, '../../src/ui/layout/XSectionWorkspace.tsx'), 'utf8')
    expect(ws).toContain('buildSectionReport')
    expect(ws).toContain('报表 MD')
    expect(ws).toContain('proSvg')
  })
})
