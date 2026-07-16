import { describe, expect, it } from 'vitest'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import { buildFlowAlignment } from '@/domain/flow/flowAlign'
import { roadgeeFlowDiagramSvg } from '@/ui/charts/roadgeeFlowDiagram'
import { roadgeeAnalysisPlanSvg } from '@/ui/charts/roadgeeAnalysisPlan'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.76 RoadGee-style diagrams (no watermark, live values)', () => {
  it('flow diagram uses table values and has no watermark', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    // set known volumes
    for (const ap of ch.approaches) {
      fl.volumes[ap.id] = { U: 0, L: 450, T: 450, R: 450 }
    }
    const svg = roadgeeFlowDiagramSvg(ch.approaches, fl, { size: 400, mode: 'natural' })
    expect(svg).toContain('1350')
    expect(svg).toContain('450')
    expect(svg).not.toMatch(/试用版|不可商用|watermark|roadgee试用/i)
    const align = buildFlowAlignment(ch.approaches, fl, 'natural')
    expect(align.rows[0].chartL).toBe(450)
  })

  it('analysis plan updates with metric and uses analysis numbers', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const analysis = analyzeIntersection(ch.approaches, fl, sg)
    const los = roadgeeAnalysisPlanSvg(ch.approaches, analysis, { metric: 'los' })
    const delay = roadgeeAnalysisPlanSvg(ch.approaches, analysis, { metric: 'delay' })
    expect(los).toContain(analysis.losFinal)
    expect(los).not.toMatch(/试用版|不可商用/)
    expect(delay).toContain(analysis.avgDelay.toFixed(1).split('.')[0].slice(0, 2) || String(Math.floor(analysis.avgDelay)))
    // delay svg should include unit hint
    expect(delay).toContain('s/pcu')
  })

  it('export catalog includes roadgee items', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    for (const id of [
      'roadgee-flow-svg',
      'roadgee-plan-los',
      'roadgee-plan-delay',
      'roadgee-plan-queue',
      'roadgee-plan-vc',
    ]) {
      expect(ids).toContain(id)
    }
  })
})
