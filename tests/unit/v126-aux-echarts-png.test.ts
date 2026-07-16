import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeAuxRoadRibbon } from '@/domain/geometry/glyphs'
import type { Mesh } from '@/domain/types'
import { isExportAvailable, EXPORT_CATALOG } from '@/io/exportCatalog'

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

describe('v0.5.126 aux glyph + echarts png export', () => {
  it('placeAuxRoadRibbon writes poly + dashed center', () => {
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
    placeAuxRoadRibbon(mesh, f, 10, 40, 8, 12, theme)
    expect(mesh.polygons.length).toBeGreaterThanOrEqual(1)
    expect(mesh.polylines.some((l) => l.dashed)).toBe(true)
  })

  it('rebuild uses placeAuxRoadRibbon when aux enabled', () => {
    const p = createCrossTemplate('aux-ec')
    const ch = p.channelizationSchemes[0]
    ch.approaches[0].auxRoad = { enabled: true, widthM: 5, offsetM: 1, openNearM: 12 }
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(4)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeAuxRoadRibbon')
  })

  it('export catalog echarts png ids + handlers + version', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('echarts-vc-delay-png')
    expect(ids).toContain('echarts-flow-ltr-png')
    expect(ids).toContain('echarts-phase-timing-png')
    const item = EXPORT_CATALOG.find((x) => x.id === 'echarts-vc-delay-png')!
    expect(
      isExportAvailable(item, {
        hasChannel: true,
        hasFlow: true,
        hasSignal: true,
        hasAnalysis: true,
        hasSelected: true,
        hasBand: true,
      }),
    ).toBe(true)
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('echarts-vc-delay-png')
    expect(app).toContain('downloadEchartsPng')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.126"')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.126 density')
  })
})
