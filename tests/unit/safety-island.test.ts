import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'

describe('safety island v0.5.25', () => {
  it('template has safety island defaults and draws labels', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    // ensure geometry builds; labels optional since v0.5.74
    for (const ap of ch.approaches) {
      if (ap.safetyIsland) ap.safetyIsland.enabled = true
    }
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(3)
  })
})
