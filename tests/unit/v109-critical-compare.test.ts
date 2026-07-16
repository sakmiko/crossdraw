import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  collectCriticalLanes,
  criticalApproachBoardSvg,
  criticalApproachMarkdown,
  criticalApproachCsv,
} from '@/ui/charts/criticalApproachBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.109 critical approach + compare timing', () => {
  it('ranks lanes by v/c', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const an = analyzeIntersection(ch.approaches, fl, sg)
    const rows = collectCriticalLanes(an)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0].isCritical).toBe(true)
    if (rows.length > 1) {
      expect(rows[0].vc).toBeGreaterThanOrEqual(rows[1].vc)
    }
    const svg = criticalApproachBoardSvg(ch.approaches, fl, sg, an)
    expect(svg).toContain('关键进口')
    expect(svg).toContain('CRITICAL')
    expect(criticalApproachMarkdown(p.name, ch.approaches, fl, sg, an)).toContain('关键')
    expect(criticalApproachCsv(an)).toContain('rank,approach')
  })

  it('workspaces + catalog', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('critical-approach-svg')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('关键进口')
    expect(aw).toContain('criticalApproachBoardSvg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('关键进口')
    const cw = readFileSync(resolve(__dirname, '../../src/ui/layout/CompareWorkspace.tsx'), 'utf8')
    expect(cw).toContain('timingCompareBoardSvg')
    expect(cw).toContain('当前方案 · 配时方法比选')
  })
})
