import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import {
  buildTimingCompareRows,
  timingCompareBoardSvg,
  timingCompareMarkdown,
  timingCompareCsv,
} from '@/ui/charts/timingCompareBoard'
import {
  collectOverlapRows,
  overlapReviewSvg,
  overlapReviewMarkdown,
  overlapReviewCsv,
} from '@/ui/charts/overlapReviewBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.106 timing compare + overlap review', () => {
  it('builds multi-method compare board', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const rows = buildTimingCompareRows(ch.approaches, fl, sg)
    expect(rows.length).toBeGreaterThanOrEqual(3)
    const svg = timingCompareBoardSvg(rows)
    expect(svg).toContain('配时方法比选')
    expect(timingCompareMarkdown(p.name, rows)).toContain('推荐')
    expect(timingCompareCsv(rows)).toContain('method,label')
  })

  it('overlap review works with and without overlaps', () => {
    const p = createCrossTemplate()
    const sg = p.channelizationSchemes[0].flowSchemes[0].signalSchemes[0]
    const empty = collectOverlapRows(sg)
    expect(Array.isArray(empty)).toBe(true)
    // force one overlap
    if (sg.phases[0]) {
      sg.phases.push({
        ...sg.phases[0],
        id: 'ov-test',
        name: '搭接测',
        isOverlap: true,
        greenSec: 8,
      })
    }
    expect(collectOverlapRows(sg).length).toBeGreaterThanOrEqual(1)
    expect(overlapReviewSvg(sg)).toContain('搭接相位审查')
    expect(overlapReviewMarkdown(p.name, sg)).toContain('搭接')
    expect(overlapReviewCsv(sg)).toContain('greenSec')
  })

  it('export + SignalWorkspace wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('timing-compare-board-svg')
    expect(ids).toContain('overlap-review-svg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('搭接相位审查')
    expect(sw).toMatch(/EChart|phaseNumber|overlap/)
  })
})
