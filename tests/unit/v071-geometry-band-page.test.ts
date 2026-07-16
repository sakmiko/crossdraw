import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTemplateByType, rebuildChannelMesh, THEME } from '@/domain'

describe('v0.5.71 geometry + band page', () => {
  it('uses unified asphalt and white marking theme', () => {
    expect(THEME.asphalt).toBe(THEME.laneFill)
    expect(THEME.marking.toLowerCase()).toMatch(/#f/)
  })

  it('Y junction mesh is closed and has corner labels', () => {
    const p = createTemplateByType('y')
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.polygons.length).toBeGreaterThan(3)
    expect(mesh.polylines.length).toBeGreaterThan(5)
    const labels = mesh.labels.map((l) => l.text).join(' ')
    // angle callouts for non-90 corners
    expect(labels).toMatch(/∠\d+°/)
  })

  it('skewed mesh builds without empty curb', () => {
    const p = createTemplateByType('skewed')
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    const road = mesh.polygons.filter((p) => p.layer === 'ROAD')
    expect(road.length).toBeGreaterThan(0)
  })

  it('App routes band to BandPage full layout', () => {
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('BandPage')
    expect(app).toContain("mode === 'band'")
    expect(app).toContain('onBackToIntersection')
    const page = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(page).toContain('干道绿波')
    expect(page).toContain('时距图')
    expect(page).toContain('交叉口设计')
  })
})
