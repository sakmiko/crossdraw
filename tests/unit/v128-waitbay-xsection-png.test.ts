import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeWaitBay } from '@/domain/geometry/glyphs'
import type { Mesh } from '@/domain/types'
import { EXPORT_CATALOG, isExportAvailable } from '@/io/exportCatalog'

describe('v0.5.128 wait bay glyph + xsection png + scheme compact', () => {
  it('placeWaitBay writes polygon', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    const f = {
      origin: [0, 0] as [number, number],
      ux: [0, 1] as [number, number],
      px: [1, 0] as [number, number],
    }
    placeWaitBay(mesh, f, 1, 10, -5, -2, '#fbbf24', { alpha: 0.4 })
    expect(mesh.polygons.length).toBe(1)
  })

  it('rebuild uses placeWaitBay; catalog + UI', () => {
    const p = createCrossTemplate('wait-xs')
    const ch = p.channelizationSchemes[0]
    ch.approaches[0].leftWait = true
    ch.approaches[0].throughWait = true
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(3)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeWaitBay')
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('echarts-xsection-png')
    const item = EXPORT_CATALOG.find((x) => x.id === 'echarts-xsection-png')!
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
    const app = ((readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve('src/io/buildExportHandlers.ts'), 'utf8')))
    expect(app).toContain('echarts-xsection-png')
    const xw = readFileSync(resolve('src/ui/layout/XSectionWorkspace.tsx'), 'utf8')
    expect(xw).toMatch(/导出 PNG|downloadEchartsPng|EChart/)
    const ss = readFileSync(resolve('src/ui/layout/SchemeSwitcher.tsx'), 'utf8')
    expect(ss).toContain('scheme-switcher--compact')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css.length).toBeGreaterThan(1000)
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
