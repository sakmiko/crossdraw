import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTemplateByType, rebuildChannelMesh } from '@/domain'

describe('v0.5.72 sidewalk/crosswalk + no-geo UI', () => {
  it('draws sidewalk segments with meta kinds (no orphan float)', () => {
    const p = createTemplateByType('y')
    const ch = p.channelizationSchemes[0]
    // ensure sidewalk present
    ch.approaches.forEach((a) => {
      a.sidewalkWidthM = 3
    })
    const mesh = rebuildChannelMesh(ch)
    const sidewalks = mesh.polygons.filter((poly) => poly.meta?.kind === 'sidewalk-entry' || poly.meta?.kind === 'sidewalk-exit')
    // each approach → 2 sidewalks
    expect(sidewalks.length).toBeGreaterThanOrEqual(ch.approaches.length)
    // crosswalk markings exist
    const marks = mesh.polylines.filter((l) => l.layer === 'MARKING')
    expect(marks.length).toBeGreaterThan(ch.approaches.length)
  })

  it('UI does not expose lat/lon or basemap coordinates', () => {
    const channel = readFileSync(resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(channel).not.toContain('纬度')
    expect(channel).not.toContain('经度')
    expect(channel).not.toContain('显示 OSM')
    const bandPage = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bandPage).not.toContain('纬度')
    expect(bandPage).not.toContain('n.lat')
    expect(bandPage).toContain('路口参数表')
    const bandWs = readFileSync(resolve(__dirname, '../../src/ui/layout/BandWorkspace.tsx'), 'utf8')
    expect(bandWs).not.toContain('纬度')
  })
})
