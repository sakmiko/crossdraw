import { describe, expect, it } from 'vitest'
import { barChartSvg, crossSectionBarSvg, lineChartSvg, ringBarrierSvg, stackedBandSvg } from '@/ui/charts/svgCharts'

describe('svg charts', () => {
  it('renders bar chart with values', () => {
    const svg = barChartSvg([
      { label: 'N', value: 0.6, color: '#34d399' },
      { label: 'E', value: 0.9, color: '#f87171' },
    ])
    expect(svg).toContain('<svg')
    expect(svg).toContain('0.60')
  })

  it('renders empty line chart gracefully', () => {
    const svg = lineChartSvg([])
    expect(svg).toContain('暂无数据')
  })

  it('renders cross section bar', () => {
    const svg = crossSectionBarSvg([
      { label: '人行', widthM: 3, color: '#ccc' },
      { label: '车道', widthM: 3.5, color: '#666' },
    ])
    expect(svg).toContain('横断面')
    expect(svg).toContain('总宽')
  })

  it('renders ring barrier and band', () => {
    const ring = ringBarrierSvg(
      [
        { name: 'P1', greenSec: 30, yellowSec: 3, allRedSec: 2 },
        { name: 'P2', greenSec: 25, yellowSec: 3, allRedSec: 2 },
      ],
      90,
    )
    expect(ring).toContain('Ring-Barrier')
    const band = stackedBandSvg(
      [
        { name: 'A', distanceM: 0, greenRatio: 0.4, offsetSec: 0 },
        { name: 'B', distanceM: 500, greenRatio: 0.5, offsetSec: 20 },
      ],
      90,
    )
    expect(band).toContain('时空图')
  })
})
