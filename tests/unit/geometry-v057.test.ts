import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'

describe('geometry v0.5.7', () => {
  it('clean canvas without legend labels on cross', () => {
    const p = createCrossTemplate()
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.polygons.length).toBeGreaterThan(3)
    expect(mesh.labels.some((l) => l.text === 'CROSSDRAW')).toBe(false)
    expect(mesh.labels.some((l) => l.text.includes('图  例'))).toBe(false)
  })
})
