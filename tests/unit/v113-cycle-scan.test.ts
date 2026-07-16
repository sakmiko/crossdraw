import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  scanCycleSensitivity,
  applyCycleScanBest,
  cycleScanMarkdown,
  cycleScanCsv,
} from '@/domain/analysis/cycleScan'
import { cycleScanBoardSvg } from '@/ui/charts/cycleScanBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.113 cycle sensitivity scan', () => {
  it('scans fixed-cycle scores and can apply best C', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const r = scanCycleSensitivity(ch.approaches, fl, sg, {
      minCycle: 60,
      maxCycle: 120,
      stepSec: 10,
    })
    expect(r.points.length).toBeGreaterThan(3)
    expect(r.bestDelay.cycleSec).toBeGreaterThanOrEqual(60)
    expect(r.bestDelay.avgDelay).toBeGreaterThanOrEqual(0)
    const next = applyCycleScanBest(ch.approaches, fl, sg, r.bestDelay.cycleSec)
    expect(next.cycleSec).toBe(r.bestDelay.cycleSec)
    const an = analyzeIntersection(ch.approaches, fl, next)
    expect(an.avgDelay).toBeGreaterThanOrEqual(0)
    expect(cycleScanBoardSvg(ch.approaches, fl, sg)).toContain('周期 C 敏感性')
    expect(cycleScanMarkdown(p.name, r)).toContain('最小延误')
    expect(cycleScanCsv(r)).toContain('cycleSec')
  })

  it('export + signal workspace wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('cycle-scan-svg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('周期 C 敏感性')
    expect(sw).toContain('应用最小延误 C')
    expect(sw).toContain('cycleScanBoardSvg')
    const st = readFileSync(resolve(__dirname, '../../src/state/store.ts'), 'utf8')
    expect(st).toContain('applyCycleScanChoice')
  })
})
