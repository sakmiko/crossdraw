import { describe, expect, it } from 'vitest'
import {
  approachCode,
  entryLaneStamp,
  exitLaneStamp,
  stopLineStationLabel,
  stopLineStationShort,
} from '@/domain/geometry/annotations'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'

describe('channel annotations v0.5.34', () => {
  it('formats stop-line station K0+xxx.x', () => {
    expect(stopLineStationLabel(18.5)).toBe('停车线 K0+018.5')
    expect(stopLineStationLabel(1205.2)).toBe('停车线 K1+205.2')
    expect(stopLineStationShort(18.5)).toBe('SL 18.5m')
  })

  it('lane stamps from median outward', () => {
    expect(entryLaneStamp(0, ['L'])).toBe('E1·L')
    expect(entryLaneStamp(1, ['T'], true)).toBe('E2·T·变')
    expect(exitLaneStamp(0)).toBe('X1')
  })

  it('mesh contains lane numbers and stop stations', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    // force a north-ish approach name for code
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.labels.some((l) => l.text.startsWith('停车线 K'))).toBe(true)
    expect(mesh.labels.some((l) => l.text.startsWith('E1·') || l.text.includes('E1·'))).toBe(true)
    expect(mesh.labels.some((l) => l.text.startsWith('X1'))).toBe(true)
    expect(mesh.labels.some((l) => l.text.includes('SL ') && l.text.includes('m'))).toBe(true)
    // approach code prefix on at least one label
    const codes = ch.approaches.map((a) => approachCode(a))
    expect(codes.every((c) => /^[NESWA]/.test(c))).toBe(true)
  })
})
