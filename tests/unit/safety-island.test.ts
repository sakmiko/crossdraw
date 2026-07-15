import { describe, expect, it } from 'vitest'
import { createCrossTemplate, rebuildChannelMesh, parseRtp, serializeRtp } from '@/domain'

describe('safety island v0.5.25', () => {
  it('template has safety island defaults and draws labels', () => {
    const p = createCrossTemplate()
    const ap = p.channelizationSchemes[0].approaches[0]
    expect(ap.rightTurn.safetyIsland?.enabled).toBe(true)
    expect(ap.rightTurn.channelWidthM).toBeGreaterThan(0)
    const mesh = rebuildChannelMesh(p.channelizationSchemes[0])
    expect(mesh.labels.some((l) => l.text.includes('安全岛') || l.text.startsWith('r='))).toBe(true)
    expect(mesh.labels.some((l) => l.text.includes('R=') && l.text.includes('道宽'))).toBe(true)
    expect(mesh.polygons.filter((x) => x.layer === 'ISLAND').length).toBeGreaterThan(2)
  })

  it('disabling safety island removes its label', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    for (const ap of ch.approaches) {
      if (ap.rightTurn.safetyIsland) ap.rightTurn.safetyIsland.enabled = false
    }
    const mesh = rebuildChannelMesh(ch)
    expect(mesh.labels.some((l) => l.text === '安全岛')).toBe(false)
  })

  it('rtp parse backfills channelWidth and safetyIsland', () => {
    const p = createCrossTemplate()
    // strip new fields to simulate old file
    const raw = JSON.parse(serializeRtp({
      format: 'crossdraw.rtp',
      schemaVersion: 1,
      appVersion: '0.5.24',
      project: p,
    }))
    for (const ch of raw.project.channelizationSchemes) {
      for (const ap of ch.approaches) {
        delete ap.rightTurn.channelWidthM
        delete ap.rightTurn.islandOffsetM
        delete ap.rightTurn.safetyIsland
      }
    }
    const file = parseRtp(JSON.stringify(raw))
    const rt = file.project.channelizationSchemes[0].approaches[0].rightTurn
    expect(rt.channelWidthM).toBeDefined()
    expect(rt.safetyIsland?.label).toBe('安全岛')
  })
})
