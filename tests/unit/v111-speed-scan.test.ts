import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, measureCorridor } from '@/domain'
import {
  scanCorridorSpeeds,
  applySpeedScanBest,
  speedScanMarkdown,
  speedScanCsv,
} from '@/domain/analysis/speedScan'
import { speedScanBoardSvg } from '@/ui/charts/speedScanBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.111 speed sensitivity scan', () => {
  it('scans design speed with fixed offsets', () => {
    const p = createCrossTemplate()
    const c = p.bandCorridor
    const scan = scanCorridorSpeeds(c, { minKmh: 30, maxKmh: 70, stepKmh: 5 })
    expect(scan.points.length).toBeGreaterThan(5)
    expect(scan.best.speedKmh).toBeGreaterThanOrEqual(30)
    expect(scan.best.totalSec).toBeGreaterThanOrEqual(0)
    const applied = applySpeedScanBest(c, scan)
    expect(applied.speedKmh).toBe(scan.best.speedKmh)
    const m = measureCorridor(applied)
    expect(m.forwardBandwidthSec + (m.backwardBandwidthSec ?? 0)).toBeGreaterThanOrEqual(0)
    expect(speedScanBoardSvg(c)).toContain('速度敏感性')
    expect(speedScanMarkdown(p.name, c.name, scan)).toContain('最优')
    expect(speedScanCsv(scan)).toContain('speedKmh')
  })

  it('export + BandPage + store wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('speed-scan-svg')
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('speed-scan')
    expect(bp).toContain('速度扫描')
    expect(bp).toContain('speedScanBoardSvg')
    const st = readFileSync(resolve(__dirname, '../../src/state/store.ts'), 'utf8')
    expect(st).toContain('applySpeedScanBest')
  })
})
