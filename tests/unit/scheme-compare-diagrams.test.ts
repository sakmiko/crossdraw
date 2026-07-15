import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import {
  collectSchemeSnapshots,
  schemeMetricsCompareSvg,
  schemeTimingStripSvg,
} from '@/ui/charts/schemeCompareDiagrams'
import { analyzeIntersection } from '@/domain/analysis'

describe('scheme compare diagrams', () => {
  it('collects snapshots and builds strip', () => {
    const p = createCrossTemplate()
    // duplicate signal for multi strip
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    fl.signalSchemes.push({
      ...fl.signalSchemes[0],
      id: 'sig-b',
      name: '备选信号',
      cycleSec: 100,
    })
    const snaps = collectSchemeSnapshots(p, analyzeIntersection)
    expect(snaps.length).toBeGreaterThanOrEqual(2)
    const strip = schemeTimingStripSvg(snaps, { max: 4, theme: 'dark' })
    expect(strip).toContain('并排配时图')
    expect(strip).toContain('配时图')
    const delay = schemeMetricsCompareSvg(snaps, { metric: 'delay' })
    expect(delay).toContain('svg')
  })
})
