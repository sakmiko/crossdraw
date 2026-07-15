import { describe, expect, it } from 'vitest'
import { createCrossTemplate, meshAreaRoad, rebuildChannelMesh } from '@/domain'

describe('geometry', () => {
  it('UT-GEO-001 non-empty mesh', () => {
    const p = createCrossTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.polygons.length).toBeGreaterThan(4)
    expect(mesh.bbox.maxX - mesh.bbox.minX).toBeGreaterThan(10)
  })

  it('UT-GEO-002 lane increase grows road area', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const a1 = meshAreaRoad(rebuildChannelMesh(ch))
    const ap = ch.approaches[0]
    ap.entryLanes.push({ id: 'x', widthM: 3.5, movements: ['T'] })
    const a2 = meshAreaRoad(rebuildChannelMesh(ch))
    expect(a2).toBeGreaterThan(a1)
  })

  it('UT-GEO-004 finite', () => {
    const p = createCrossTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    for (const poly of mesh.polygons) {
      for (const [x, y] of poly.points) {
        expect(Number.isFinite(x)).toBe(true)
        expect(Number.isFinite(y)).toBe(true)
      }
    }
  })
})
