import { describe, expect, it } from 'vitest'
import {
  createCrossTemplate,
  createTemplateByType,
  buildDualRingAlignment,
  buildDualRingStages,
  enableDualRing,
  disableDualRing,
  buildSignalTimingAlignment,
  rebuildChannelMesh,
} from '@/domain'
import { dualRingDiagramSvg } from '@/ui/charts/dualRingDiagram'

describe('v0.5.67 dual-ring + skewed corners', () => {
  it('auto dual-ring assigns R1/R2 and reports stage closure', () => {
    const p = createCrossTemplate()
    const sg0 = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    const sg = enableDualRing(sg0, true)
    expect(sg.dualRing?.enabled).toBe(true)
    const r1 = sg.phases.filter((x) => x.ring === 1).length
    const r2 = sg.phases.filter((x) => x.ring === 2).length
    expect(r1).toBeGreaterThan(0)
    expect(r2).toBeGreaterThan(0)
    const al = buildDualRingAlignment(sg)
    expect(al.enabled).toBe(true)
    expect(al.stages.length).toBeGreaterThan(0)
    expect(al.stageSumSec).toBeGreaterThan(0)
    // with concurrent max, stage sum should be <= sequential main sum
    const sequential = sg.phases
      .filter((ph) => !ph.isOverlap)
      .reduce((s, ph) => s + ph.greenSec + ph.yellowSec + ph.allRedSec, 0)
    expect(al.stageSumSec).toBeLessThanOrEqual(sequential + 0.01)
  })

  it('timingAlign uses dual-ring stage sum for closed when enabled', () => {
    const p = createCrossTemplate()
    let sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    sg = enableDualRing(sg, true)
    // force cycle to stage sum → closed
    const dual = buildDualRingAlignment(sg)
    sg = { ...sg, cycleSec: dual.stageSumSec }
    const align = buildSignalTimingAlignment(sg)
    expect(align.dualRingEnabled).toBe(true)
    expect(align.closed).toBe(true)
    expect(align.dualRingStageSumSec).toBeCloseTo(dual.stageSumSec, 5)
  })

  it('disable dual-ring clears ring fields', () => {
    const p = createCrossTemplate()
    let sg = enableDualRing(p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0], true)
    sg = disableDualRing(sg)
    expect(sg.dualRing?.enabled).toBe(false)
    expect(sg.phases.every((ph) => ph.ring == null)).toBe(true)
  })

  it('dual-ring diagram renders professional chrome', () => {
    const p = createCrossTemplate()
    const sg = enableDualRing(p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0], true)
    const svg = dualRingDiagramSvg(sg)
    expect(svg).toContain('双环栏图')
    expect(svg).toContain('R1')
    expect(svg).toContain('R2')
    expect(svg).toContain('chart-svg--pro')
  })

  it('skewed mesh includes corner angle labels', () => {
    const p = createTemplateByType('skewed')
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    const labels = mesh.labels.map((l) => l.text).join(' ')
    expect(labels).toMatch(/∠\d+°/)
  })

  it('buildDualRingStages groups by barrier', () => {
    const p = createCrossTemplate()
    const sg = enableDualRing(p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0], true)
    const stages = buildDualRingStages(sg)
    expect(stages[0].barrierIndex).toBe(0)
    expect(stages[0].stageSec).toBe(Math.max(stages[0].ring1SumSec, stages[0].ring2SumSec))
  })
})
