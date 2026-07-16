import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'

describe('v0.5.21 channel drawing sheet', () => {
  it('clean canvas — no CAD chrome labels', () => {
    const mesh = rebuildChannelMesh(createCrossTemplate().channelizationSchemes[0])
    expect(mesh.labels.some((l) => l.text === 'CROSSDRAW')).toBe(false)
    expect(mesh.polygons.length).toBeGreaterThan(2)
  })
})
