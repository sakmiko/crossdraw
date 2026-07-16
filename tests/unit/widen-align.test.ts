import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh } from '@/domain'

describe('widen alignment v0.5.26', () => {
  it('mesh annotation updates with widen params', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const ap = ch.approaches[0]
    if (ap.widen) {
      ap.widen.entryBayCount = 1
      ap.widen.entryBayWidthM = 3.5
    }
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(3)
    expect(mesh.polylines.length).toBeGreaterThan(3)
  })
})
