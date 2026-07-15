import { describe, expect, it } from 'vitest'
import { convertVolumes, createCrossTemplate } from '@/domain'

describe('flow', () => {
  it('UT-FLW-001 heavy 0 keeps natural', () => {
    const p = createCrossTemplate()
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    fl.heavyRatio = 0
    const id = p.channelizationSchemes[0].approaches[0].id
    fl.volumes[id] = { U: 0, L: 100, T: 200, R: 50 }
    const r = convertVolumes(fl, [id])[0]
    expect(r.pcu.T).toBe(200)
  })

  it('UT-FLW-002 phf scales peak', () => {
    const p = createCrossTemplate()
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    fl.heavyRatio = 0
    fl.phf = 0.5
    const id = p.channelizationSchemes[0].approaches[0].id
    fl.volumes[id] = { U: 0, L: 0, T: 100, R: 0 }
    const r = convertVolumes(fl, [id])[0]
    expect(r.peak.T).toBeCloseTo(200, 5)
  })
})
