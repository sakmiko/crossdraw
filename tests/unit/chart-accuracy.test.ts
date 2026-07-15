import { describe, expect, it } from 'vitest'
import { signalTimingDiagramSvg, flowMovementDiagramSvg } from '@/ui/charts/professionalDiagrams'
import { losByControlDelay, fmtNum, timeTicks, vcHeatAccurate } from '@/ui/charts/chartStandards'
import { createCrossTemplate, analyzeIntersection } from '@/domain'

describe('professional chart accuracy', () => {
  it('timing chart uses cycle C and shows balance', () => {
    const phases = [
      { name: 'φ1', greenSec: 30, yellowSec: 3, allRedSec: 2 },
      { name: 'φ2', greenSec: 30, yellowSec: 3, allRedSec: 2 },
    ]
    const C = 70
    const svg = signalTimingDiagramSvg(phases, C)
    expect(svg).toContain('C = 70')
    expect(svg).toContain('闭合')
    // phase sum 70
    expect(svg).toContain('Σ(G+Y+AR)=70.0s')
  })

  it('timing detects open cycle', () => {
    const phases = [{ name: 'φ1', greenSec: 40, yellowSec: 3, allRedSec: 2 }]
    const svg = signalTimingDiagramSvg(phases, 90)
    expect(svg).toContain('与 C 差')
  })

  it('flow labels use integer pcu/h', () => {
    const svg = flowMovementDiagramSvg([
      { name: '北', bearingDeg: 0, L: 120, T: 450, R: 80 },
    ])
    expect(svg).toContain('450')
    expect(svg).toContain('pcu/h')
  })

  it('LOS and heat standards', () => {
    expect(losByControlDelay(9)).toBe('A')
    expect(losByControlDelay(81)).toBe('F')
    expect(vcHeatAccurate(1.1)).toBe('#991b1b')
    expect(timeTicks(90).includes(90)).toBe(true)
    expect(fmtNum(0.856, 'vc')).toBe('0.856')
  })

  it('analysis delay is finite and LOS consistent', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = analyzeIntersection(ch.approaches, fl, sg)
    expect(Number.isFinite(r.avgDelay)).toBe(true)
    expect(r.avgDelay).toBeGreaterThanOrEqual(0)
    expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(r.losFinal)
  })
})
