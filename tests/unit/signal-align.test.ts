import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import {
  buildSignalTimingAlignment,
  signalChartsAlignWithTable,
} from '@/domain/signal/timingAlign'
import { ringBarrierSvg } from '@/ui/charts/svgCharts'
import { signalTimingDiagramSvg as proTiming } from '@/ui/charts/professionalDiagrams'

describe('signal timing alignment v0.5.16', () => {
  it('alignment rows match phase fields', () => {
    const p = createCrossTemplate()
    const sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    const al = buildSignalTimingAlignment(sg)
    expect(al.chartPhases.length).toBe(sg.phases.length)
    expect(signalChartsAlignWithTable(sg).ok).toBe(true)
    al.rows.forEach((r, i) => {
      expect(r.greenSec).toBe(sg.phases[i].greenSec)
      expect(r.yellowSec).toBe(sg.phases[i].yellowSec)
      expect(r.allRedSec).toBe(sg.phases[i].allRedSec)
      expect(r.durationSec).toBe(r.greenSec + r.yellowSec + r.allRedSec)
    })
  })

  it('ring and pro timing use cycle C not phase-sum stretch', () => {
    const phases = [
      { name: 'φ1', greenSec: 30, yellowSec: 3, allRedSec: 2 },
      { name: 'φ2', greenSec: 25, yellowSec: 3, allRedSec: 2 },
    ]
    const C = 90
    const ring = ringBarrierSvg(phases, C)
    expect(ring).toContain('C=90')
    expect(ring).toContain('轴=C')
    const pro = proTiming(phases, C)
    expect(pro).toContain('C = 90')
  })

  it('detects open cycle on alignment', () => {
    const p = createCrossTemplate()
    const sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    // force mismatch
    sg.cycleSec = 999
    const al = buildSignalTimingAlignment(sg)
    expect(al.closed).toBe(false)
  })
})
