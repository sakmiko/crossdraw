import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeBorrowLeftPocket } from '@/domain/geometry/glyphs'
import type { Mesh } from '@/domain/types'

const theme = {
  marking: '#fff',
  yellow: '#fc0',
  curb: '#111',
  asphalt: '#333',
  asphaltEdge: '#222',
  island: '#86efac',
  islandEdge: '#166534',
  crosswalk: '#fff',
  laneFill: '#3f4a5a',
  laneAlt: '#465366',
}

describe('v0.5.129 borrow-left glyph + flow/signal PNG', () => {
  it('placeBorrowLeftPocket writes mesh', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    const f = {
      origin: [0, 0] as [number, number],
      ux: [1, 0] as [number, number],
      px: [0, 1] as [number, number],
    }
    placeBorrowLeftPocket(mesh, f, 2, 14, 0, 2, theme)
    expect(mesh.polygons.length).toBeGreaterThanOrEqual(1)
    expect(mesh.polylines.length).toBeGreaterThanOrEqual(1)
  })

  it('rebuild + UI PNG buttons + version', () => {
    const p = createCrossTemplate('borrow')
    const ch = p.channelizationSchemes[0]
    ch.approaches[0].borrowLeft = true
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(3)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeBorrowLeftPocket')
    const fw = readFileSync(resolve('src/ui/layout/FlowWorkspace.tsx'), 'utf8')
    expect(fw).toContain('downloadEchartsPng')
    expect(fw).toContain('导出 PNG')
    const sw = readFileSync(resolve('src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('downloadEchartsPng')
    expect(sw).toContain('导出 PNG')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.129 contrast')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
