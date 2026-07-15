import { describe, expect, it } from 'vitest'
import { createCrossTemplate, parseRtp, serializeRtp, wrapProject } from '@/domain'
import {
  countPedIntervals,
  pedSummary,
  pedWalkFdw,
  phaseHasPed,
  togglePedCrossing,
} from '@/domain/signal/pedestrian'
import { pedestrianPhaseStripSvg } from '@/ui/charts/pedestrianDiagram'
import { useAppStore } from '@/state/store'

describe('pedestrian phase v0.5.37', () => {
  it('toggles crossings and walk/fdw split', () => {
    const p = createCrossTemplate()
    const sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    const ph = sg.phases[0]
    const ap = p.channelizationSchemes[0].approaches[0]
    const next = togglePedCrossing(ph, ap.id)
    expect(phaseHasPed(next)).toBe(true)
    expect(pedSummary(next, p.channelizationSchemes[0].approaches)).not.toBe('无行人')
    next.greenSec = 20
    const { walk, fdw } = pedWalkFdw(next)
    expect(walk + fdw).toBeCloseTo(20, 5)
  })

  it('rtp roundtrip keeps pedestrian', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    sg.phases[0].pedestrian = [{ approachId: ch.approaches[0].id, exclusive: true }]
    const file = parseRtp(serializeRtp(wrapProject(p, '0.5.37')))
    expect(file.project.channelizationSchemes[0].flowSchemes[0].signalSchemes[0].phases[0].pedestrian?.[0].exclusive).toBe(
      true,
    )
  })

  it('store toggle and strip svg', () => {
    useAppStore.getState().resetTemplate()
    const st = useAppStore.getState()
    const ch = st.getActiveChannel()!
    const sg = st.getActiveSignal()!
    const ph = sg.phases[0]
    const ap = ch.approaches[0]
    useAppStore.getState().togglePhasePedestrian(ph.id, ap.id)
    const sg2 = useAppStore.getState().getActiveSignal()!
    expect(countPedIntervals(sg2)).toBeGreaterThanOrEqual(1)
    const svg = pedestrianPhaseStripSvg(sg2, ch.approaches)
    expect(svg).toContain('行人过街相位条')
  })
})
