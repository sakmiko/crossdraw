import { describe, expect, it } from 'vitest'
import { approachHash, buildCrossSection, createCrossTemplate, markStaleIfNeeded } from '@/domain'

describe('xsection', () => {
  it('UT-XS-001 lane components', () => {
    const ap = createCrossTemplate().channelizationSchemes[0].approaches[0]
    const xs = buildCrossSection(ap)
    const vehicles = xs.components.filter((c) => c.type === 'vehicle' && c.label.startsWith('进口'))
    expect(vehicles.length).toBe(ap.entryLanes.length)
  })

  it('UT-XS-002 stale', () => {
    const ap = createCrossTemplate().channelizationSchemes[0].approaches[0]
    const xs = buildCrossSection(ap)
    ap.entryLanes[0].widthM = 4
    const s = markStaleIfNeeded(xs, ap)
    expect(s.stale).toBe(true)
    expect(approachHash(ap)).not.toBe(xs.sourceHash)
  })
})
