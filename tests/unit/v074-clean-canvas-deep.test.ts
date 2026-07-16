import { describe, expect, it } from 'vitest'
import {
  createCrossTemplate,
  createTemplateByType,
  rebuildChannelMesh,
  enableDualRing,
  autoAssignDualRings,
  applyPedTimingToSignal,
  allocateGreensByBarrierCriticalY,
  computeMovementCapacities,
  computeCoordinationIndex,
  applyProgressiveOffsets,
  buildMaxbandReport,
  websterLostTime,
  sizeWalkFdw,
  estimateQueueStorage,
  schemeDeltas,
} from '@/domain'

describe('v0.5.74 clean canvas + deep pack', () => {
  it('mesh has no legend / title-block / B= labels', () => {
    const p = createCrossTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    const texts = mesh.labels.map((l) => l.text).join('|')
    expect(texts).not.toContain('CROSSDRAW')
    expect(texts).not.toContain('图  例')
    expect(texts).not.toContain('B=')
    expect(texts).not.toMatch(/停车线/)
    // geometry still present
    expect(mesh.polygons.length).toBeGreaterThan(4)
    expect(mesh.polylines.length).toBeGreaterThan(8)
  })

  it('Y template also clean of drafting chrome', () => {
    const p = createTemplateByType('y')
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.labels.some((l) => l.text === 'CROSSDRAW')).toBe(false)
    expect(mesh.labels.some((l) => l.text.includes('交叉口渠化'))).toBe(false)
  })

  it('ped Walk/FDW from crosswalk length', () => {
    const r = sizeWalkFdw(14)
    expect(r.walkSec).toBeGreaterThanOrEqual(7)
    expect(r.fdwSec).toBeGreaterThanOrEqual(5)
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    let sg = fl.signalSchemes[0]
    // ensure ped faces
    sg = {
      ...sg,
      phases: sg.phases.map((ph, i) =>
        i === 0
          ? {
              ...ph,
              pedestrian: ch.approaches.map((a) => ({ approachId: a.id, exclusive: false })),
            }
          : ph,
      ),
    }
    const next = applyPedTimingToSignal(sg, ch.approaches)
    expect(next.phases[0].pedWalkSec).toBeGreaterThan(0)
    expect(next.phases[0].pedFdwSec).toBeGreaterThan(0)
  })

  it('barrier critical green allocation when dual-ring on', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    let sg = enableDualRing(fl.signalSchemes[0])
    sg = { ...sg, phases: autoAssignDualRings(sg, 1) }
    const { signal, notes } = allocateGreensByBarrierCriticalY(ch.approaches, fl, sg)
    expect(signal.phases.some((ph) => ph.greenSec >= 4)).toBe(true)
    expect(notes.length).toBeGreaterThan(0)
  })

  it('movement sat, queue, lost time, coordination, progressive, maxband report, scheme delta', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const caps = computeMovementCapacities(ch.approaches, fl)
    expect(caps.length).toBeGreaterThan(0)
    const q = estimateQueueStorage({
      approachName: '北',
      movement: 'T',
      volumeVph: 600,
      redSec: 40,
      cycleSec: 90,
      lanes: 2,
    })
    expect(q.storageM).toBeGreaterThan(0)
    expect(websterLostTime({ mainPhaseCount: 4 }).L).toBe(12)
    const band = p.bandCorridor
    const prog = applyProgressiveOffsets(band, false)
    expect(prog.nodes[0].offsetSec).toBeDefined()
    const ci = computeCoordinationIndex(band)
    expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(ci.grade)
    const rep = buildMaxbandReport(band)
    expect(rep.nodes.length).toBe(band.nodes.length)
    const d = schemeDeltas(
      { label: 'A', avgVc: 0.8, avgDelay: 30, los: 'C', cycleSec: 90 },
      [
        { label: 'A', avgVc: 0.8, avgDelay: 30, los: 'C', cycleSec: 90 },
        { label: 'B', avgVc: 0.7, avgDelay: 25, los: 'C', cycleSec: 85 },
      ],
    )
    expect(d[0].better).toBe(true)
  })
})
