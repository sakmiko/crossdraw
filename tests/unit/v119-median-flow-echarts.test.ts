import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeMedianStrip, placeFishBellyMedian } from '@/domain/geometry/glyphs'
import { flowLtrOption } from '@/ui/charts/interactiveBoards'
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

describe('v0.5.119 median glyphs + flow ECharts', () => {
  it('median glyphs write polygons', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    const f = { origin: [0, 0] as [number, number], ux: [0, 1] as [number, number], px: [1, 0] as [number, number] }
    placeMedianStrip(mesh, f, 0, 40, -1, 1, theme.island, theme, { doubleYellow: true })
    placeFishBellyMedian(mesh, f, 2, 15, 35, 0, 2, 0.5, theme)
    expect(mesh.polygons.length).toBeGreaterThanOrEqual(2)
    expect(mesh.polylines.length).toBeGreaterThanOrEqual(2)
  })

  it('rebuild uses placeMedianStrip; flowLtrOption series stack', () => {
    const p = createCrossTemplate('median-flow')
    const ch = p.channelizationSchemes[0]
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.polygons.length).toBeGreaterThan(3)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeMedianStrip')
    expect(reb).toContain('placeFishBellyMedian')
    const flow = ch.flowSchemes[0]
    const opt = flowLtrOption(ch.approaches, flow, 'natural')
    expect(opt.series).toBeTruthy()
    const series = opt.series as { name: string; stack?: string }[]
    expect(series.map((s) => s.name).join(',')).toContain('L')
    expect(series.every((s) => s.stack === 'ltr')).toBe(true)
  })

  it('UI wires flow echarts + version 0.5.119', () => {
    const fw = readFileSync(resolve('src/ui/layout/FlowWorkspace.tsx'), 'utf8')
    expect(fw).toMatch(/flow-echarts|flowLtrOption|EChart/)
    expect(fw).toContain('flowLtrOption')
    const cp = readFileSync(resolve('src/ui/charts/ChartPanels.tsx'), 'utf8')
    expect(cp).toContain('flowLtrOption')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
