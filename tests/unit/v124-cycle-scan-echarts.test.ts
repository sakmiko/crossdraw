import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { scanCycleSensitivity } from '@/domain/analysis/cycleScan'
import { cycleScanOption } from '@/ui/charts/interactiveBoards'

describe('v0.5.124 cycle scan ECharts + responsive shell', () => {
  it('cycleScanOption maps scan points', () => {
    const p = createCrossTemplate('c-scan')
    const ch = p.channelizationSchemes[0]
    const flow = ch.flowSchemes[0]
    const signal = flow.signalSchemes[0]
    const r = scanCycleSensitivity(ch.approaches, flow, signal, {
      minCycle: 60,
      maxCycle: 100,
      stepSec: 10,
    })
    expect(r.points.length).toBeGreaterThan(2)
    const opt = cycleScanOption(
      r.points.map((pt) => ({ c: pt.cycleSec, delay: pt.avgDelay, maxVc: pt.maxVc })),
      signal.cycleSec,
    )
    const series = opt.series as { name: string; type: string }[]
    expect(series.some((s) => s.name === '延误')).toBe(true)
    expect(series.some((s) => s.name === '最大 v/c')).toBe(true)
  })

  it('SignalWorkspace wires cycle-scan-echarts + CSS shell marker', () => {
    const sw = readFileSync(resolve('src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('cycle-scan-echarts')
    expect(sw).toContain('cycleScanOption')
    expect(sw).toContain('cycleScanLive')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css.length).toBeGreaterThan(1000)
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
  })
})
