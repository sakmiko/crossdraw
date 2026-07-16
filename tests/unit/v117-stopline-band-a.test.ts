import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { rebuildChannelMesh } from '@/domain/geometry/rebuild'
import { placeStopLine, placeZebra } from '@/domain/geometry/glyphs'
import {
  enumerateHalfCycleA,
  optimizeBandClassic,
  optimizeBandMaxScan,
} from '@/domain/analysis/band'
import type { BandIntersection, Mesh } from '@/domain/types'

function sampleNodes(): BandIntersection[] {
  return [
    { id: 'n0', name: 'A', distanceM: 0, cycleSec: 80, greenRatio: 0.45, offsetSec: 0, locked: false },
    { id: 'n1', name: 'B', distanceM: 400, cycleSec: 80, greenRatio: 0.45, offsetSec: 0, locked: false },
    { id: 'n2', name: 'C', distanceM: 800, cycleSec: 80, greenRatio: 0.4, offsetSec: 0, locked: false },
  ]
}

describe('v0.5.117 stop-line glyph + band a-scan', () => {
  it('placeStopLine + rebuild uses glyph', () => {
    const mesh: Mesh = {
      polygons: [],
      polylines: [],
      labels: [],
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    placeStopLine(
      mesh,
      { origin: [0, 0], ux: [0, 1], px: [1, 0] },
      10,
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
    )
    expect(mesh.polylines.length).toBeGreaterThanOrEqual(2)
    const p = createCrossTemplate('stopline')
    const m = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(m.polylines.length).toBeGreaterThan(5)
    const reb = readFileSync(resolve('src/domain/geometry/rebuild.ts'), 'utf8')
    expect(reb).toContain('placeStopLine')
  })

  it('classic a-scan uses ±100m / 10m grid around a0', () => {
    const nodes = sampleNodes()
    const C = 80
    const vKmh = 40
    const { a0, bestA, candidates } = enumerateHalfCycleA(nodes, C, vKmh, { rangeM: 100, stepM: 10 })
    expect(candidates).toBeGreaterThanOrEqual(20)
    expect(Math.abs(a0 - ((40 / 3.6) * C) / 2)).toBeLessThan(1e-6)
    // bestA should land on a0 + k*10 grid
    const k = Math.round((bestA - a0) / 10)
    expect(Math.abs(bestA - (a0 + k * 10))).toBeLessThan(1e-6)
    const classic = optimizeBandClassic(nodes, C, vKmh)
    expect(classic.method).toBe('classic')
    expect(classic.bandwidthSec).toBeGreaterThanOrEqual(0)
    const opt = optimizeBandMaxScan(nodes, C, vKmh)
    expect(opt.method).toBe('optimized-scan')
    // optimized should be at least as good as classic grid (seconds sum)
    const c2 = enumerateHalfCycleA(nodes, C, vKmh, { rangeM: 100, stepM: 10 })
    expect(opt.forwardBandwidthSec! + (opt.backwardBandwidthSec ?? 0)).toBeGreaterThanOrEqual(
      c2.best.forwardSec + c2.best.backwardSec - 1e-6,
    )
  })

  it('version + BandPage title', () => {
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.117"')
    const app = readFileSync(resolve('src/ui/layout/App.tsx'), 'utf8')
    expect(app).toMatch(/v0\.5\.117/)
    const band = readFileSync(resolve('src/domain/analysis/band.ts'), 'utf8')
    expect(band).toContain('enumerateHalfCycleA')
    expect(band).toContain('rangeM: 100')
  })
})
