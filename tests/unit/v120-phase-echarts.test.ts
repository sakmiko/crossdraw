import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { phaseTimingOption } from '@/ui/charts/interactiveBoards'

describe('v0.5.120 phase timing ECharts', () => {
  it('phaseTimingOption stacks G/Y/AR and marks C', () => {
    const p = createCrossTemplate('phase-ec')
    const ch = p.channelizationSchemes[0]
    const signal = ch.flowSchemes[0].signalSchemes[0]
    const opt = phaseTimingOption(signal)
    const series = opt.series as { name: string; stack?: string; type: string }[]
    expect(series.find((s) => s.name === '绿')?.stack).toBe('ph')
    expect(series.find((s) => s.name === '黄')?.type).toBe('bar')
    expect(series.find((s) => s.name === 'C')?.type).toBe('line')
    const main = signal.phases.filter((ph) => !ph.isOverlap)
    const sum = main.reduce((a, ph) => a + ph.greenSec + ph.yellowSec + ph.allRedSec, 0)
    expect(sum).toBeGreaterThan(0)
  })

  it('UI wires signal-echarts + version', () => {
    const sw = readFileSync(resolve('src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('signal-echarts')
    expect(sw).toContain('phaseTimingOption')
    const cp = readFileSync(resolve('src/ui/charts/ChartPanels.tsx'), 'utf8')
    expect(cp).toContain('phaseTimingOption')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.120 signal polish')
  })
})
