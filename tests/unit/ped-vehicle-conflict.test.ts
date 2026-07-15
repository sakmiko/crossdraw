import { describe, expect, it } from 'vitest'
import { createCrossTemplate, detectPhaseConflicts, detectPedVehicleConflicts } from '@/domain'

describe('ped-vehicle conflict v0.5.38', () => {
  it('flags same-approach right turn vs ped face', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const ap = ch.approaches[0]
    const ph = {
      id: 'p1',
      name: '测试相',
      greenSec: 20,
      yellowSec: 3,
      allRedSec: 2,
      releases: { [ap.id]: ['R' as const] },
      pedestrian: [{ approachId: ap.id, exclusive: false }],
    }
    const { hits, issues } = detectPedVehicleConflicts([ph], ch.approaches)
    expect(hits.some((h) => h.movement === 'R' && h.reason.includes('右转'))).toBe(true)
    expect(issues.some((i) => i.code === 'PED_VEH_CONFLICT')).toBe(true)
  })

  it('exclusive ped elevates to block', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const ap = ch.approaches[0]
    const ph = {
      id: 'p1',
      name: '独行人',
      greenSec: 18,
      yellowSec: 3,
      allRedSec: 2,
      releases: { [ap.id]: ['R' as const] },
      pedestrian: [{ approachId: ap.id, exclusive: true }],
    }
    const { hits } = detectPedVehicleConflicts([ph], ch.approaches)
    expect(hits.some((h) => h.level === 'block')).toBe(true)
  })

  it('detectPhaseConflicts includes ped-veh issues', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const ap = ch.approaches.find((a) => a.bearingDeg === 0)!
    const opp = ch.approaches.find((a) => a.bearingDeg === 180)!
    const phases = [
      {
        id: 'p1',
        name: '相1',
        greenSec: 25,
        yellowSec: 3,
        allRedSec: 2,
        releases: { [opp.id]: ['L' as const] },
        pedestrian: [{ approachId: ap.id }],
      },
    ]
    const issues = detectPhaseConflicts(phases, ch.approaches)
    expect(issues.some((i) => i.code.startsWith('PED_VEH'))).toBe(true)
  })
})
