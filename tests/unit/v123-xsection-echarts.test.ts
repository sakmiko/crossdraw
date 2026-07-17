import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { buildCrossSection } from '@/domain/xsection/build'
import { xsectionWidthOption } from '@/ui/charts/interactiveBoards'

describe('v0.5.123 xsection ECharts', () => {
  it('xsectionWidthOption bar + pie from components', () => {
    const p = createCrossTemplate('xs-ec')
    const ap = p.channelizationSchemes[0].approaches[0]
    const xs = buildCrossSection(ap)
    expect(xs.components.length).toBeGreaterThan(2)
    const opt = xsectionWidthOption(xs.components)
    const series = opt.series as { name: string; type: string }[]
    expect(series.some((s) => s.name === '宽度' && s.type === 'bar')).toBe(true)
    expect(series.some((s) => s.name === '类型占比' && s.type === 'pie')).toBe(true)
  })

  it('UI wires xsection-echarts + version', () => {
    const xw = readFileSync(resolve('src/ui/layout/XSectionWorkspace.tsx'), 'utf8')
    expect(xw).toContain('xsection-echarts')
    expect(xw).toContain('xsectionWidthOption')
    const cp = readFileSync(resolve('src/ui/charts/ChartPanels.tsx'), 'utf8')
    expect(cp).toContain('xsectionWidthOption')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css.length).toBeGreaterThan(1000)
  })
})
