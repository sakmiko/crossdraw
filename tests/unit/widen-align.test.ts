import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'
import {
  buildWidenProfile,
  entryLateralExtraAt,
  entryWidenExtraM,
  widenAnnotation,
} from '@/domain/geometry/widen'

describe('widen alignment v0.5.26', () => {
  it('entry extra equals count × width (no fudge)', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    ap.widen.entryWidenCount = 2
    ap.widen.entryWidenWidthM = 3.5
    expect(entryWidenExtraM(ap.widen)).toBeCloseTo(7, 6)
    const prof = buildWidenProfile(ap, 120)
    expect(entryLateralExtraAt(prof, 0)).toBeCloseTo(7, 6)
    expect(entryLateralExtraAt(prof, ap.widen.entryWidenLengthM)).toBeCloseTo(7, 6)
    expect(entryLateralExtraAt(prof, ap.widen.entryWidenLengthM + ap.widen.entryTaperM)).toBe(0)
    expect(widenAnnotation(ap)).toContain('加宽7.0m')
  })

  it('mesh annotation updates with widen params', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    ch.approaches[0].widen = {
      ...ch.approaches[0].widen,
      entryWidenCount: 1,
      entryWidenWidthM: 3.5,
      entryWidenLengthM: 60,
      entryTaperM: 25,
    }
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.labels.some((l) => l.text.includes('进口展宽') && l.text.includes('60'))).toBe(true)
    expect(mesh.labels.some((l) => l.text === '段尽' || l.text === '渐尽')).toBe(true)
  })

  it('zero count yields no entry extra', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    ap.widen.entryWidenCount = 0
    expect(entryWidenExtraM(ap.widen)).toBe(0)
    expect(widenAnnotation(ap)).toBeNull()
  })
})
