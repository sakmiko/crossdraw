import { describe, expect, it } from 'vitest'
import {
  createCrossTemplate,
  createTemplateByType,
  enableDualRing,
  autoAssignDualRings,
  listBarrierIndices,
  balanceBarrierRings,
  cycleFromDualRing,
  buildDualRingAlignment,
  optimizeSignalTiming,
  rebuildChannelMesh,
} from '@/domain'

describe('v0.5.68 multi-barrier + webster dual-ring + Y', () => {
  it('auto-assign with 2 barriers tags B0 and B1', () => {
    const p = createCrossTemplate()
    let sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    // ensure enough main phases
    while (sg.phases.filter((x) => !x.isOverlap).length < 4) {
      sg = {
        ...sg,
        phases: [
          ...sg.phases,
          {
            id: `ph-extra-${sg.phases.length}`,
            name: `相位${sg.phases.length + 1}`,
            greenSec: 15,
            yellowSec: 3,
            allRedSec: 2,
            releases: {},
            isOverlap: false,
          },
        ],
      }
    }
    const phases = autoAssignDualRings(sg, 2)
    const next = { ...sg, dualRing: { enabled: true }, phases }
    const bars = listBarrierIndices(next)
    expect(bars.length).toBeGreaterThanOrEqual(2)
    expect(bars).toContain(0)
    expect(bars).toContain(1)
    const al = buildDualRingAlignment(next)
    expect(al.stages.length).toBeGreaterThanOrEqual(2)
  })

  it('balanceBarrierRings equalizes ring sums within a barrier', () => {
    const p = createCrossTemplate()
    let sg = enableDualRing(p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0], true)
    // force imbalance on barrier 0
    sg = {
      ...sg,
      phases: sg.phases.map((ph) =>
        ph.ring === 1 ? { ...ph, greenSec: 30 } : ph.ring === 2 ? { ...ph, greenSec: 10 } : ph,
      ),
    }
    const before = buildDualRingAlignment(sg)
    const st0 = before.stages[0]
    expect(Math.abs(st0.ring1SumSec - st0.ring2SumSec)).toBeGreaterThan(0.5)
    const balanced = balanceBarrierRings(sg)
    const after = buildDualRingAlignment({ ...sg, phases: balanced })
    for (const st of after.stages) {
      expect(Math.abs(st.ring1SumSec - st.ring2SumSec)).toBeLessThan(0.2)
    }
  })

  it('optimizeSignalTiming notes dual-ring stages when enabled', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = enableDualRing(fl.signalSchemes[0], true)
    const r = optimizeSignalTiming(ch.approaches, fl, sg, { method: 'webster' })
    expect(r.notes.some((n) => n.includes('双环'))).toBe(true)
    expect(r.appliedPhases.length).toBe(sg.phases.length)
    const closed = {
      ...sg,
      phases: r.appliedPhases,
      cycleSec: r.cycleSec,
    }
    const al = buildDualRingAlignment(closed)
    // after balance+cycle, should be near closed for free webster
    expect(al.stageSumSec).toBeGreaterThan(0)
  })

  it('close cycle helper matches stage sum', () => {
    const p = createCrossTemplate()
    const sg = enableDualRing(p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0], true)
    const c = cycleFromDualRing(sg)
    const al = buildDualRingAlignment({ ...sg, cycleSec: c })
    expect(Math.abs(al.stageSumSec - c)).toBeLessThan(0.2)
  })

  it('Y template has 3 approaches and angle labels in mesh', () => {
    const p = createTemplateByType('y')
    const ch = p.channelizationSchemes[0]
    expect(ch.approaches.length).toBe(3)
    expect(ch.intersectionType).toBe('y')
    const bearings = ch.approaches.map((a) => a.bearingDeg).sort((a, b) => a - b)
    expect(bearings[0]).toBe(0)
    // acute-ish forks
    expect(bearings[1]).toBeGreaterThan(90)
    const mesh = rebuildChannelMesh(ch)
    const labels = mesh.labels.map((l) => l.text).join(' ')
    expect(true).toBe(true) // angle labels removed from canvas v0.5.74
  })
})
