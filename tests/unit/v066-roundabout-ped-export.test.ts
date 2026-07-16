import { describe, expect, it } from 'vitest'
import {
  createTemplateByType,
  createCrossTemplate,
  computeRoundaboutLayout,
  makePedestrianOnlyPhase,
  rebuildChannelMesh,
} from '@/domain'
import { pedestrianRingSvg } from '@/ui/charts/pedestrianRing'
import { EXPORT_CATALOG, isExportAvailable } from '@/io/exportCatalog'
import { buildVissimInpxPack } from '@/io/vissimInpx'
import { buildMultiPageReportHtml } from '@/io/multiPageReport'
import { analyzeIntersection } from '@/domain/analysis'

describe('v0.5.66 roundabout ped export', () => {
  it('roundabout layout scales with approach width and mesh labels', () => {
    const p = createTemplateByType('roundabout')
    const ch = p.channelizationSchemes[0]
    const layout = computeRoundaboutLayout(ch.approaches, 12)
    expect(layout.laneCount).toBeGreaterThanOrEqual(1)
    expect(layout.outerR).toBeGreaterThan(layout.innerR)
    const mesh = rebuildChannelMesh(ch, ch.flowSchemes[0])
    const labels = mesh.labels.map((l) => l.text).join(' ')
    expect(labels).toMatch(/环岛|环道/)
  })

  it('pedestrian ring shows exclusive faces for ped-only phase', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const ids = ch.approaches.map((a) => a.id)
    const ped = makePedestrianOnlyPhase('ped1', '行人相位', ids, 18)
    sg.phases.push(ped)
    const svg = pedestrianRingSvg(ch.approaches, sg, { focusPhaseId: ped.id })
    expect(svg).toContain('行人')
    expect(svg).toContain('专用行人相位')
    expect(svg).toContain('Walk')
  })

  it('export catalog gates new deliverables', () => {
    const ids = EXPORT_CATALOG.map((i) => i.id)
    expect(ids).toContain('vissim-inpx')
    expect(ids).toContain('multi-page-report')
    expect(ids).toContain('ped-ring-svg')
    const ctx = {
      hasChannel: true,
      hasFlow: true,
      hasSignal: true,
      hasAnalysis: true,
      hasSelected: true,
      hasBand: true,
      timingClosed: true,
      flowAligned: true,
      analysisOk: true,
    }
    for (const id of ['vissim-inpx', 'multi-page-report', 'ped-ring-svg'] as const) {
      const item = EXPORT_CATALOG.find((i) => i.id === id)!
      expect(isExportAvailable(item, ctx)).toBe(true)
    }
  })

  it('inpx + multipage still consistent', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const pack = buildVissimInpxPack(p.name, ch.approaches, fl, sg)
    expect(pack.xml).toContain('CrossdrawVissimInterchange')
    const analysis = analyzeIntersection(ch.approaches, fl, sg)
    const html = buildMultiPageReportHtml({
      project: p,
      channel: ch,
      flow: fl,
      signal: sg,
      analysis,
      bandCorridor: p.bandCorridor,
    })
    expect(html).toContain('第 5 / 5 页')
  })
})
