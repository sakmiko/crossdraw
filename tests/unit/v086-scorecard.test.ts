import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { collectCompareRows } from '@/io/report'
import { analyzeIntersection } from '@/domain/analysis'
import {
  schemeScorecardSvg,
  kpisFromCompareRows,
  recommendBestLabel,
} from '@/ui/charts/schemeScorecard'
import { schemeDeltas } from '@/domain/analysis/schemeDiff'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.86 scheme scorecard', () => {
  it('builds scorecard and deltas', () => {
    const p = createCrossTemplate()
    // duplicate signal for multi-scheme
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    fl.signalSchemes.push({
      ...fl.signalSchemes[0],
      id: 'sig-b',
      name: '方案B',
      cycleSec: 100,
      phases: fl.signalSchemes[0].phases.map((ph) => ({ ...ph, greenSec: ph.greenSec + 2 })),
    })
    const rows = collectCompareRows(p, analyzeIntersection)
    expect(rows.length).toBeGreaterThanOrEqual(2)
    const kpis = kpisFromCompareRows(rows, {})
    const svg = schemeScorecardSvg(kpis, { baseIndex: 0 })
    expect(svg).toContain('方案比选记分卡')
    expect(svg).not.toContain('试用版')
    const best = recommendBestLabel(kpis)
    expect(best).toBeTruthy()
    const deltas = schemeDeltas(kpis[0], kpis)
    expect(deltas.length).toBeGreaterThan(0)
  })

  it('catalog + CompareWorkspace wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('compare-scorecard-svg')
    const cw = readFileSync(resolve(__dirname, '../../src/ui/layout/CompareWorkspace.tsx'), 'utf8')
    expect(cw).toContain('schemeScorecardSvg')
    expect(cw).toContain('基准方案')
  })
})
