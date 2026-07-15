import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh, analyzeIntersection } from '@/domain'
import {
  setLaneVariable,
  mergeAdjacentLaneGroups,
  splitLaneGroup,
  laneMovementLabel,
  rebuildLaneGroupsFromLanes,
} from '@/domain/geometry/laneGroups'

describe('variable lane & groups v0.5.29', () => {
  it('marks variable and labels mesh', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const ap = ch.approaches[0]
    setLaneVariable(ap, 1, true)
    expect(ap.entryLanes[1].variable).toBe(true)
    expect(ap.entryLanes[1].movements.length).toBeGreaterThanOrEqual(2)
    expect(laneMovementLabel(ap.entryLanes[1])).toContain('变')
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.labels.some((l) => l.text === '可变' || l.text.includes('·变'))).toBe(true)
  })

  it('merge and split lane groups', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    ap.laneGroups = rebuildLaneGroupsFromLanes(ap)
    const before = ap.laneGroups.length
    expect(mergeAdjacentLaneGroups(ap, 0, 1)).toBe(true)
    expect(ap.laneGroups.length).toBe(before - 1)
    const multi = ap.laneGroups.find((g) => g.laneIds.length > 1)!
    splitLaneGroup(ap, multi.id)
    expect(ap.laneGroups.every((g) => g.laneIds.length === 1)).toBe(true)
  })

  it('variable lane affects capacity vs exclusive', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const ap = ch.approaches[0]
    // ensure T volume
    fl.volumes[ap.id] = { U: 0, L: 200, T: 800, R: 150 }
    const base = analyzeIntersection(ch.approaches, fl, sg)
    const t0 = base.lanes.find((l) => l.approachId === ap.id && l.movement === 'T')
    setLaneVariable(ap, ap.entryLanes.findIndex((l) => l.movements.includes('T')), true)
    // force T lane multi-mov
    const tLane = ap.entryLanes.find((l) => l.movements.includes('T'))!
    tLane.variable = true
    tLane.movements = ['L', 'T']
    const after = analyzeIntersection(ch.approaches, fl, sg)
    const t1 = after.lanes.find((l) => l.approachId === ap.id && l.movement === 'T')
    expect(t0 && t1).toBeTruthy()
    // capacity should drop or sat factor applied when variable multi-mov
    if (t0 && t1) {
      expect(t1.satFlow).toBeLessThanOrEqual(t0.satFlow * 1.01)
    }
  })
})
