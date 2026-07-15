import { describe, expect, it } from 'vitest'
import { createCrossTemplate, cloneBandCorridor } from '@/domain'
import {
  collectCorridorKpis,
  corridorKpiCompareSvg,
  multiBandMarkdown,
} from '@/ui/charts/bandCorridorCompare'

describe('multi corridor compare v0.5.28', () => {
  it('collects kpis for each corridor', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '走廊B'))
    p.bandCorridors[1].speedKmh = 50
    const rows = collectCorridorKpis(p.bandCorridors)
    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe(p.bandCorridors[0].name)
    expect(rows[1].speedKmh).toBe(50)
    expect(rows[0].forwardSec).toBeGreaterThanOrEqual(0)
    expect(rows[0].bandwidthRatio).toBeGreaterThanOrEqual(0)
  })

  it('svg and markdown contain corridor names', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '辅路'))
    const rows = collectCorridorKpis(p.bandCorridors)
    const svg = corridorKpiCompareSvg(rows)
    expect(svg).toContain('多走廊带宽对比')
    expect(svg).toContain('上行')
    const md = multiBandMarkdown(p.name, rows)
    expect(md).toContain('辅路')
    expect(md).toContain('带宽比')
  })
})
