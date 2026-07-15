import { describe, expect, it } from 'vitest'
import { createCrossTemplate, createYTemplate, rebuildChannelMesh, meshAreaRoad } from '@/domain'

describe('geometry v0.5.7', () => {
  it('draws legend and dimension labels on cross', () => {
    const p = createCrossTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0], p.channelizationSchemes[0].flowSchemes[0])
    expect(mesh.labels.some((l) => l.text === '图例')).toBe(true)
    expect(mesh.labels.some((l) => l.text.startsWith('B='))).toBe(true)
    expect(mesh.labels.some((l) => l.text.startsWith('R='))).toBe(true)
    expect(meshAreaRoad(mesh)).toBeGreaterThan(100)
    expect(mesh.polygons.filter((p) => p.layer === 'ISLAND').length).toBeGreaterThan(0)
  })

  it('y junction still rebuilds', () => {
    const p = createYTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.polygons.length).toBeGreaterThan(8)
  })
})
