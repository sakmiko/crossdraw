import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeRibbonBetween, placeCurbStroke } from '@/domain/geometry/glyphs'
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

describe('v0.5.125 sidewalk ribbon glyphs + channel KPI', () => {
  it('placeRibbonBetween + curb stroke write mesh', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    const inner: [number, number][] = [
      [0, 0],
      [10, 0],
    ]
    const outer: [number, number][] = [
      [0, 2],
      [10, 2],
    ]
    placeRibbonBetween(mesh, inner, outer, '#ccc', '#999', { meta: { kind: 'sidewalk-entry' } })
    placeCurbStroke(mesh, inner, theme)
    expect(mesh.polygons.length).toBeGreaterThanOrEqual(1)
    expect(mesh.polylines.length).toBeGreaterThanOrEqual(1)
  })

  it('rebuild uses ribbon glyphs; channel KPI UI', () => {
    const p = createCrossTemplate('sw-kpi')
    const ch = p.channelizationSchemes[0]
    ch.approaches[0].sidewalkWidthM = 2.5
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(5)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeRibbonBetween')
    expect(reb).toContain('placeCurbStroke')
    const cw = readFileSync(resolve('src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(cw).toContain('非机动车道')
    expect(cw).toContain('bikeEnabled')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.125 channel kpi')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
