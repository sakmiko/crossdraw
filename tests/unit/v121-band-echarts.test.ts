import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { bandBandwidthOption } from '@/ui/charts/interactiveBoards'
import { measureCorridor } from '@/domain/analysis/corridor'

describe('v0.5.121 band bandwidth ECharts', () => {
  it('option has offset bars and band lines', () => {
    const p = createCrossTemplate('band-ec')
    const corridor = p.bandCorridor
    const band = measureCorridor(corridor)
    const opt = bandBandwidthOption(corridor, band)
    const series = opt.series as { name: string; type: string }[]
    expect(series.some((s) => s.name === '相位差' && s.type === 'bar')).toBe(true)
    expect(series.some((s) => s.name === '上行b')).toBe(true)
    expect(series.some((s) => s.name === '下行b')).toBe(true)
  })

  it('BandPage wires host + version', () => {
    const bp = readFileSync(resolve('src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('band-echarts')
    expect(bp).toContain('bandBandwidthOption')
    const pkg = readFileSync(resolve('package.json'), 'utf8')
    expect(pkg).toMatch(/"version": "0\.5\.\d+"/)
    const css = readFileSync(resolve('src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.121 band echarts')
  })
})
