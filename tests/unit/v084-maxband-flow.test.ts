import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { buildMaxbandReport } from '@/domain/analysis/maxbandReport'
import { maxbandReportDiagramSvg } from '@/ui/charts/maxbandReportDiagram'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.84 MAXBAND report + flow stack', () => {
  it('builds diagram from corridor offsets', () => {
    const p = createCrossTemplate()
    let c = { ...p.bandCorridor, method: 'maxband-discrete' as const }
    const rep = buildMaxbandReport(c)
    expect(rep.nodes.length).toBeGreaterThan(0)
    const svg = maxbandReportDiagramSvg(c, { report: rep })
    expect(svg).toContain('MAXBAND')
    expect(svg).toContain('相位差')
    expect(svg).not.toContain('试用版')
  })

  it('export catalog has maxband items', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('maxband-report-svg')
    expect(ids).toContain('maxband-report-md')
    expect(ids).toContain('maxband-report-csv')
  })

  it('BandPage wires maxband tab; CSS stacks flow', () => {
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain("tab === 'maxband'")
    expect(bp).toContain('maxbandReportDiagramSvg')
    expect(bp).toContain('优化并应用')
    const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')
    expect(css).toMatch(/shell--signal/)
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('maxband-report-svg')
  })
})
