import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { analyzeIntersection } from '@/domain/analysis'
import { collectCompareRows } from '@/io/report'
import { compareSchemesOption } from '@/ui/charts/interactiveBoards'

describe('v0.5.122 compare schemes ECharts', () => {
  it('compareSchemesOption dual series from rows', () => {
    const p = createCrossTemplate('cmp-ec')
    const rows = collectCompareRows(p, analyzeIntersection).map((r) => ({
      label: `${r.channel}/${r.signal}`,
      avgVc: r.avgVc,
      avgDelay: r.avgDelay,
      los: r.los,
    }))
    expect(rows.length).toBeGreaterThan(0)
    const opt = compareSchemesOption(rows)
    const series = opt.series as { name: string; type: string }[]
    expect(series.some((s) => s.name === '延误' && s.type === 'bar')).toBe(true)
    expect(series.some((s) => s.name === 'v/c' && s.type === 'line')).toBe(true)
  })

  it('UI wires compare-echarts + version', () => {
    const cw = readFileSync(resolve('src/ui/layout/CompareWorkspace.tsx'), 'utf8')
    expect(cw).toContain('compare-echarts')
    expect(cw).toContain('compareSchemesOption')
    const cp = readFileSync(resolve('src/ui/charts/ChartPanels.tsx'), 'utf8')
    expect(cp).toContain('compareSchemesOption')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toContain('"version": "0.5.122"')
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.122 compare')
  })
})
