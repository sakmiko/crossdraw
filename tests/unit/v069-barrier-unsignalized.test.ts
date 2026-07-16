import { describe, expect, it } from 'vitest'
import {
  createCrossTemplate,
  createTemplateByType,
  enableDualRing,
  autoAssignDualRings,
  computeDualRingCriticalFlow,
  allocateDualRingGreens,
  optimizeSignalTiming,
  analyzeUnsignalized,
  analyzeRoundabout,
  analyzeTwsc,
  rebuildChannelMesh,
} from '@/domain'
import { unsignalizedChartSvg } from '@/ui/charts/unsignalizedChart'

describe('v0.5.69 barrier Y + unsignalized + fishbelly', () => {
  it('dual-ring critical Y is <= sequential sum of phase y', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    let sg = fl.signalSchemes[0]
    while (sg.phases.filter((x) => !x.isOverlap).length < 4) {
      sg = {
        ...sg,
        phases: [
          ...sg.phases,
          {
            id: `x${sg.phases.length}`,
            name: `相位${sg.phases.length + 1}`,
            greenSec: 12,
            yellowSec: 3,
            allRedSec: 2,
            releases: {},
            isOverlap: false,
          },
        ],
      }
    }
    // assign releases so y > 0
    sg = {
      ...sg,
      dualRing: { enabled: true },
      phases: autoAssignDualRings(sg, 2).map((ph, i) => {
        const ap = ch.approaches[i % ch.approaches.length]
        return {
          ...ph,
          releases: { [ap.id]: ['T' as const] },
        }
      }),
    }
    const crit = computeDualRingCriticalFlow(ch.approaches, fl, sg)
    expect(crit.enabled).toBe(true)
    expect(crit.barriers.length).toBeGreaterThanOrEqual(1)
    expect(crit.Y).toBeLessThanOrEqual(crit.sequentialY + 1e-6)
    expect(crit.Y).toBeGreaterThan(0)
  })

  it('webster with dual-ring mentions dual-ring critical Y', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = enableDualRing(fl.signalSchemes[0], true)
    const r = optimizeSignalTiming(ch.approaches, fl, sg, { method: 'webster' })
    expect(r.notes.some((n) => n.includes('双环'))).toBe(true)
    const greens = allocateDualRingGreens(ch.approaches, fl, sg, r.cycleSec, r.lostTimeSec, 8)
    expect(greens.length).toBeGreaterThan(0)
  })

  it('roundabout unsignalized analysis produces legs', () => {
    const p = createTemplateByType('roundabout')
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    expect(sg.unsignalized).toBe(true)
    const u = analyzeUnsignalized(ch.approaches, fl, sg, ch.intersectionType)
    expect(u.mode).toBe('roundabout')
    expect(u.legs.length).toBeGreaterThan(0)
    expect(u.avgDelay).toBeGreaterThan(0)
    const svg = unsignalizedChartSvg(u)
    expect(svg).toContain('环形进口能力示意')
  })

  it('twsc analysis marks major and minor', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const u = analyzeTwsc(ch.approaches, fl)
    expect(u.mode).toBe('twsc')
    expect(u.legs.some((l) => l.note.includes('主路'))).toBe(true)
    expect(u.legs.some((l) => l.note.includes('次路'))).toBe(true)
  })

  it('fish-belly median mesh labels', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    ch.approaches[0].median = { style: 'fishBelly', widthM: 3.5 }
    const mesh = rebuildChannelMesh(ch)
    const labels = mesh.labels.map((l) => l.text).join(' ')
    expect(labels).toContain('鱼腹式')
  })
})
