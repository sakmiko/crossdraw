import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import {
  bearingToUnit,
  buildConflictDiagram,
  conflictDiagramSvg,
  movementPathPoints,
} from '@/domain/signal/conflictDiagram'

describe('conflict diagram v0.5.36', () => {
  it('maps bearing 0 to north (-Y)', () => {
    const u = bearingToUnit(0)
    expect(u.x).toBeCloseTo(0, 5)
    expect(u.y).toBeCloseTo(-1, 5)
  })

  it('through path has entry and exit', () => {
    const pts = movementPathPoints(0, 'T', 40, 12)
    expect(pts.length).toBeGreaterThanOrEqual(3)
    expect(pts[0].y).toBeLessThan(0)
  })

  it('builds points for cross template and svg', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    // force opposing through in phase 0
    const n = ch.approaches.find((a) => a.bearingDeg === 0)!
    const s = ch.approaches.find((a) => a.bearingDeg === 180)!
    sg.phases[0].releases = { [n.id]: ['T'], [s.id]: ['T'] }
    const model = buildConflictDiagram(ch.approaches, sg, sg.phases[0].id)
    expect(model.paths.length).toBe(12)
    expect(model.points.length).toBeGreaterThan(0)
    expect(model.activeCount).toBeGreaterThan(0)
    const svg = conflictDiagramSvg(model)
    expect(svg).toContain('冲突点示意图')
    expect(svg).toContain('禁止')
  })
})
