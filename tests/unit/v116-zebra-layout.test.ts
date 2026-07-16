import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeZebra } from '@/domain/geometry/glyphs'
import type { Mesh } from '@/domain/types'

describe('v0.5.117 zebra glyph + left-right layout', () => {
  it('placeZebra writes polylines', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    placeZebra(
      mesh,
      { origin: [0, 0], ux: [0, 1], px: [1, 0] },
      12,
      5,
      {
        marking: '#fff',
        yellow: '#fc0',
        curb: '#111',
        asphalt: '#333',
        asphaltEdge: '#444',
        island: '#2a2',
        islandEdge: '#1a1',
        crosswalk: '#fff',
        laneFill: '#444',
        laneAlt: '#555',
      },
      { depth: 3, pitch: 1 },
    )
    expect(mesh.polylines.length).toBeGreaterThan(2)
  })

  it('channel mesh rebuild succeeds for cross template', () => {
    const p = createCrossTemplate('zebra-layout')
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.polygons.length + mesh.polylines.length).toBeGreaterThan(10)
  })

  it('CSS: all modes left-right; signal not vertical-only; density tokens', () => {
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.116 layout')
    expect(css).toContain('--ctrl-h')
    expect(css).toContain('--input-num')
    // signal must be columns L|R not 46vh stack only
    expect(css).toMatch(/shell--signal[\s\S]*minmax\(0,\s*1fr\)\s+minmax\(300px/)
    expect(css).not.toMatch(/SIGNAL ONLY: always vertical/)
  })

  it('rebuild uses placeZebra; version 0.5.117', () => {
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeZebra')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toMatch(/v0\.5\.\d+/)
  })
})
