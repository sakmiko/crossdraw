import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import {
  placeChannelRibbon,
  placeChannelIslandArc,
  placeSafetyDisc,
} from '@/domain/geometry/glyphs'
import type { Mesh } from '@/domain/types'

const theme = {
  marking: '#fff',
  yellow: '#fc0',
  curb: '#111',
  asphalt: '#333',
  asphaltEdge: '#444',
  island: '#86efac',
  islandEdge: '#166534',
  crosswalk: '#fff',
  laneFill: '#3f4a5a',
  laneAlt: '#465366',
}

describe('v0.5.118 channel island glyphs + layout polish', () => {
  it('ribbon + island + safety disc write mesh', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    placeChannelRibbon(mesh, [0, 0], 12, 8, 0, 1.2, theme)
    placeChannelIslandArc(mesh, [0, 0], 8, 4, 0, 1.2, theme, false)
    placeSafetyDisc(mesh, [5, 5], 1.5, theme.island, theme)
    expect(mesh.polygons.length).toBeGreaterThanOrEqual(3)
    expect(mesh.polylines.length).toBeGreaterThan(0)
  })

  it('rebuild with free-right approach uses glyphs', () => {
    const p = createCrossTemplate('rt-island')
    const ch = p.channelizationSchemes[0]
    // enable right turn on first approach if fields exist
    const ap = ch.approaches[0]
    if (ap.rightTurn) {
      ap.rightTurn.enabled = true
      ap.rightTurn.style = 'island'
      ap.rightTurn.radiusM = 12
      ap.rightTurn.widthM = 3.5
      if (ap.rightTurn.safetyIsland) {
        ap.rightTurn.safetyIsland.enabled = true
        ap.rightTurn.safetyIsland.radiusM = 1.5
      }
    }
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(5)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeChannelRibbon')
    expect(reb).toContain('placeChannelIslandArc')
    expect(reb).toContain('placeSafetyDisc')
  })

  it('version + css polish marker', () => {
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.118"')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.118 page polish')
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toMatch(/v0\.5\.118/)
  })
})
