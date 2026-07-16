import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import {
  scanCorridorOffsets,
  applyOffsetScanBest,
  offsetScanMarkdown,
  offsetScanCsv,
} from '@/domain/analysis/offsetScan'
import { offsetScanBoardSvg } from '@/ui/charts/offsetScanBoard'
import { measureCorridor } from '@/domain'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.110 offset scan', () => {
  it('scans free-node offset and finds a best', () => {
    const p = createCrossTemplate()
    const c = p.bandCorridor
    expect(c.nodes.length).toBeGreaterThanOrEqual(2)
    const scan = scanCorridorOffsets(c, { stepSec: 5 })
    expect(scan.points.length).toBeGreaterThan(5)
    expect(scan.C).toBeGreaterThan(0)
    expect(scan.best.totalSec).toBeGreaterThanOrEqual(0)
    const applied = applyOffsetScanBest(c, scan)
    const free = applied.nodes.find((n) => n.id === scan.freeNodeId)
    expect(free?.offsetSec).toBeCloseTo(scan.bestDeltaSec, 5)
    const m = measureCorridor(applied)
    expect(m.forwardBandwidthSec + (m.backwardBandwidthSec ?? 0)).toBeGreaterThanOrEqual(0)
    expect(offsetScanBoardSvg(c)).toContain('相位差扫描')
    expect(offsetScanMarkdown(p.name, c.name, scan)).toContain('最优')
    expect(offsetScanCsv(scan)).toContain('offsetSec')
  })

  it('export + BandPage wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('offset-scan-svg')
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('offset-scan')
    expect(bp).toContain('扫描并应用')
    expect(bp).toContain('offsetScanBoardSvg')
    const st = readFileSync(resolve(__dirname, '../../src/state/store.ts'), 'utf8')
    expect(st).toContain('applyOffsetScanBest')
  })
})
