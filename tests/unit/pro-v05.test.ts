import { describe, expect, it } from 'vitest'
import {
  createCrossTemplate,
  createRoundaboutTemplate,
  createSkewedTemplate,
  createTemplateByType,
  createYTemplate,
  optimizeSignalTiming,
  rebuildChannelMesh,
} from '@/domain'
import {
  controlMatrixSvg,
  flowMovementDiagramSvg,
  signalTimingDiagramSvg,
  timeSpaceDiagramSvg,
} from '@/ui/charts/professionalDiagrams'

describe('intersection templates', () => {
  it('builds Y with 3 approaches', () => {
    const p = createYTemplate()
    expect(p.channelizationSchemes[0].approaches).toHaveLength(3)
    expect(p.channelizationSchemes[0].intersectionType).toBe('y')
  })

  it('builds skewed and roundabout meshes', () => {
    const skew = createSkewedTemplate()
    const ra = createRoundaboutTemplate()
    const m1 = rebuildChannelMesh(skew.channelizationSchemes[0])
    const m2 = rebuildChannelMesh(ra.channelizationSchemes[0])
    expect(m1.polygons.length).toBeGreaterThan(5)
    expect(m2.polygons.length).toBeGreaterThan(5)
    expect(ra.channelizationSchemes[0].flowSchemes[0].signalSchemes[0].unsignalized).toBe(true)
  })

  it('createTemplateByType covers kinds', () => {
    expect(createTemplateByType('t').channelizationSchemes[0].intersectionType).toBe('t')
    expect(createTemplateByType('cross').channelizationSchemes[0].intersectionType).toBe('cross')
  })
})

describe('optimizeSignalTiming', () => {
  it('returns cycle and applied phases (Webster)', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = optimizeSignalTiming(ch.approaches, fl, sg, { targetVc: 0.9, startLoss: 3 })
    expect(r.cycleSec).toBeGreaterThanOrEqual(40)
    expect(r.cycleSec).toBeLessThanOrEqual(180)
    expect(r.appliedPhases.length).toBe(sg.phases.length)
    expect(r.Y).toBeGreaterThan(0)
    expect(r.notes.join(' ')).toContain('Webster')
  })
})

describe('professional diagrams', () => {
  it('renders timing control flow timespace svg', () => {
    const t = signalTimingDiagramSvg(
      [
        { name: 'φ1', greenSec: 30, yellowSec: 3, allRedSec: 2 },
        { name: 'φ2', greenSec: 25, yellowSec: 3, allRedSec: 2 },
      ],
      90,
    )
    expect(t).toContain('配时图')
    const c = controlMatrixSvg(['北', '南'], [{ name: 'φ1', releases: { a: ['T'] } }], ['a'])
    expect(c).toContain('管控')
    const f = flowMovementDiagramSvg([{ name: '北', bearingDeg: 0, L: 100, T: 400, R: 80 }])
    expect(f).toContain('流向')
    const ts = timeSpaceDiagramSvg(
      [
        { name: 'A', distanceM: 0, greenRatio: 0.4, offsetSec: 0, cycleSec: 90 },
        { name: 'B', distanceM: 500, greenRatio: 0.45, offsetSec: 20, cycleSec: 90 },
      ],
      50,
    )
    expect(ts).toContain('时距图')
  })
})
