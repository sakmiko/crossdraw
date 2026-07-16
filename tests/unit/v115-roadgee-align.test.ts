import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import { placeMovementArrow } from '@/domain/geometry/glyphs'
import type { Mesh } from '@/domain/types'

describe('v0.5.116 RoadGee-aligned analysis + glyphs', () => {
  it('Cap = S·λ and Vc = V/Cap (homology identity)', () => {
    const p = createCrossTemplate('同源测试')
    const ch = p.channelizationSchemes[0]
    const flow = ch.flowSchemes[0]
    const signal = flow.signalSchemes[0]
    const r = analyzeIntersection(ch.approaches, flow, signal)
    expect(r.lanes.length).toBeGreaterThan(0)
    for (const l of r.lanes) {
      const cap = l.satFlow * l.greenRatio
      expect(Math.abs(l.capacity - cap)).toBeLessThan(1e-9)
      if (l.capacity > 0) {
        expect(Math.abs(l.vc - l.volumePeak / l.capacity)).toBeLessThan(1e-9)
      }
    }
  })

  it('HCM-like delay d1+d2 matches analyzeIntersection (T=0.25, k=0.5)', () => {
    const p = createCrossTemplate('延误测试')
    const ch = p.channelizationSchemes[0]
    const flow = ch.flowSchemes[0]
    const signal = flow.signalSchemes[0]
    const r = analyzeIntersection(ch.approaches, flow, signal)
    for (const l of r.lanes) {
      const C = Math.max(1, signal.cycleSec)
      const lambda = l.greenRatio
      const x = Math.min(l.vc, 1.2)
      const xmin = Math.min(1, x)
      const d1 = (0.5 * C * (1 - lambda) ** 2) / Math.max(0.01, 1 - lambda * xmin)
      const d2 =
        l.capacity > 0
          ? 900 * 0.25 * ((x - 1) + Math.sqrt((x - 1) ** 2 + (8 * 0.5 * x) / (l.capacity * 0.25)))
          : 0
      expect(Math.abs(l.delaySec - Math.max(0, d1 + d2))).toBeLessThan(1e-9)
    }
  })

  it('glyph movement arrow writes mesh geometry', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    placeMovementArrow(
      mesh,
      { origin: [0, 0], ux: [0, 1], px: [1, 0] },
      0,
      0,
      ['T', 'L'],
      {
        marking: '#fff',
        yellow: '#f5c542',
        curb: '#111',
        asphalt: '#333',
        asphaltEdge: '#444',
        island: '#2a2',
        islandEdge: '#1a1',
        crosswalk: '#fff',
        laneFill: '#444',
        laneAlt: '#555',
      },
    )
    expect(mesh.polygons.length + mesh.polylines.length).toBeGreaterThan(0)
  })

  it('UI wires ECharts + glyphs + roundabout islandR', () => {
    const charts = readFileSync(resolve('src/ui/charts/ChartPanels.tsx'), 'utf8')
    expect(charts).toContain('vcDelayOption')
    expect(charts).toContain('EChart')
    const stage = readFileSync(resolve('src/ui/layout/ModeCenterStage.tsx'), 'utf8')
    expect(stage).toContain("'live'")
    expect(stage).toContain('交互图')
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeMovementArrow')
    expect(reb).toContain('islandR')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
    expect(pkg).toContain('echarts')
    const aw = readFileSync(resolve('src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('analysis-echarts')
  })
})
