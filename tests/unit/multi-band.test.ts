import { describe, expect, it } from 'vitest'
import { createCrossTemplate, parseRtp, serializeRtp, normalizeBandCorridors, cloneBandCorridor } from '@/domain'
import { useAppStore } from '@/state/store'

describe('multi band corridors v0.5.27', () => {
  it('template has bandCorridors synced with active', () => {
    const p = createCrossTemplate()
    expect(p.bandCorridors.length).toBe(1)
    expect(p.activeBandId).toBe(p.bandCorridor.id)
    expect(p.bandCorridors[0].id).toBe(p.bandCorridor.id)
  })

  it('normalize upgrades legacy single bandCorridor', () => {
    const p = createCrossTemplate()
    const legacy = {
      ...p,
      bandCorridors: [] as typeof p.bandCorridors,
      activeBandId: '',
    }
    legacy.bandCorridors = []
    legacy.activeBandId = ''
    normalizeBandCorridors(legacy)
    expect(legacy.bandCorridors.length).toBe(1)
    expect(legacy.activeBandId).toBe(legacy.bandCorridor.id)
  })

  it('rtp roundtrip keeps multi corridors', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '辅路走廊'))
    p.activeBandId = p.bandCorridors[1].id
    p.bandCorridor = p.bandCorridors[1]
    const file = parseRtp(
      serializeRtp({ format: 'crossdraw.rtp', schemaVersion: 1, appVersion: '0.5.27', project: p }),
    )
    expect(file.project.bandCorridors.length).toBe(2)
    expect(file.project.activeBandId).toBe(file.project.bandCorridors[1].id)
    expect(file.project.bandCorridor.name).toBe('辅路走廊')
  })

  it('store can add and switch corridors', () => {
    useAppStore.getState().resetTemplate()
    const before = useAppStore.getState().project.bandCorridors.length
    useAppStore.getState().addBandCorridor()
    const mid = useAppStore.getState().project
    expect(mid.bandCorridors.length).toBe(before + 1)
    const id0 = mid.bandCorridors[0].id
    useAppStore.getState().setActiveBand(id0)
    expect(useAppStore.getState().project.bandCorridor.id).toBe(id0)
    useAppStore.getState().duplicateBandCorridor()
    expect(useAppStore.getState().project.bandCorridors.length).toBe(before + 2)
  })
})
