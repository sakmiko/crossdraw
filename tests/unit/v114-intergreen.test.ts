import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import {
  collectIntergreenRows,
  applyIntergreenRecommendations,
  recommendYellowSec,
  recommendAllRedSec,
  intergreenMarkdown,
  intergreenCsv,
} from '@/domain/signal/intergreen'
import { intergreenBoardSvg } from '@/ui/charts/intergreenBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.114 intergreen review', () => {
  it('recommends yellow/all-red and can apply', () => {
    expect(recommendYellowSec(40)).toBeGreaterThanOrEqual(3)
    expect(recommendAllRedSec(14, 40)).toBeGreaterThanOrEqual(1)

    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = {
      ...fl.signalSchemes[0],
      phases: fl.signalSchemes[0].phases.map((ph) => ({
        ...ph,
        yellowSec: 1,
        allRedSec: 0.5,
      })),
    }
    const rows = collectIntergreenRows(sg, ch.approaches)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((r) => r.status === 'short')).toBe(true)

    const next = applyIntergreenRecommendations(sg, ch.approaches, { onlyShort: true })
    expect(next.phases[0].yellowSec).toBeGreaterThanOrEqual(3)
    expect(intergreenBoardSvg(sg, ch.approaches)).toContain('清空间隔审查')
    expect(intergreenMarkdown(p.name, rows)).toContain('清空间隔')
    expect(intergreenCsv(rows)).toContain('yellow')
  })

  it('export + UI + store wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('intergreen-svg')
    expect(ids).toContain('intergreen-md')
    expect(ids).toContain('intergreen-csv')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('清空间隔审查')
    expect(sw).toContain('修正偏短黄/全红')
    expect(sw).toContain('intergreenBoardSvg')
    const st = readFileSync(resolve(__dirname, '../../src/state/store.ts'), 'utf8')
    expect(st).toContain('applyIntergreenRecs')
    expect(st).toContain('applyIntergreenRecommendations')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toMatch(/v0\.5\.\d+/)
  })
})
