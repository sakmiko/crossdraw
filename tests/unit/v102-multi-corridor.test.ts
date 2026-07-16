import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, cloneBandCorridor } from '@/domain'
import {
  collectCorridorReportRows,
  professionalMultiCorridorReportSvg,
  multiCorridorReportMarkdown,
  multiCorridorReportCsv,
} from '@/ui/charts/professionalMultiCorridorReport'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.102 multi-corridor report', () => {
  it('builds report with coordination grades', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '辅路走廊'))
    p.bandCorridors[1].speedKmh = 50
    const rows = collectCorridorReportRows(p.bandCorridors)
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(rows[0].coordGrade).toMatch(/^[A-F]$/)
    const svg = professionalMultiCorridorReportSvg(p.bandCorridors, {
      width: 1000,
      projectName: p.name,
    })
    expect(svg).toContain('多走廊绿波报告')
    expect(svg).toContain('协调')
    expect(svg).not.toContain('试用版')
    expect(multiCorridorReportMarkdown(p.name, p.bandCorridors)).toContain('协调指数')
    expect(multiCorridorReportCsv(p.bandCorridors)).toContain('coordScore')
  })

  it('export + BandPage wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('multi-corridor-report-svg')
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('多走廊报告 SVG')
    expect(bp).toContain('professionalMultiCorridorReportSvg')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('multi-corridor-report-svg')
  })
})
