import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  professionalCapacityMatrixSvg,
  capacityMatrixCsv,
  capacityMatrixMarkdown,
} from '@/ui/charts/professionalCapacityMatrix'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.99 capacity matrix', () => {
  it('builds matrix with lane rows and KPI', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const a = analyzeIntersection(ch.approaches, fl, sg)
    const svg = professionalCapacityMatrixSvg(ch.approaches, a, {
      width: 920,
      projectName: p.name,
      signalName: sg.name,
    })
    expect(svg).toContain('车道组通行能力')
    expect(svg).toContain('均v/c')
    expect(svg).toContain('LOS')
    expect(svg.length).toBeGreaterThan(1500)
    const md = capacityMatrixMarkdown(p.name, a)
    expect(md).toContain('通行能力')
    expect(md).toContain('LOS')
    const csv = capacityMatrixCsv(a)
    expect(csv).toContain('volume')
    expect(csv).toContain('satFlow')
  })

  it('export + UI wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('capacity-matrix-svg')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('Vissim 交换包')
    expect(aw).toContain('professionalCapacityMatrixSvg')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('capacity-matrix-svg')
  })
})
