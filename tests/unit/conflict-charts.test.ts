import { describe, expect, it } from 'vitest'
import { buildConflictMatrix, classifyPair, listMovementKeys } from '@/domain/signal/conflictMatrix'
import { createCrossTemplate } from '@/domain'
import { conflictMatrixSvg, losGaugeSvg, radarChartSvg } from '@/ui/charts/svgCharts'

describe('conflict matrix', () => {
  it('lists 12 movement keys for 4-leg cross', () => {
    const p = createCrossTemplate()
    const keys = listMovementKeys(p.channelizationSchemes[0].approaches)
    expect(keys).toHaveLength(12)
  })

  it('flags opposing through as block', () => {
    const p = createCrossTemplate()
    const aps = p.channelizationSchemes[0].approaches
    const n = aps.find((a) => a.bearingDeg === 0)!
    const s = aps.find((a) => a.bearingDeg === 180)!
    const cell = classifyPair(
      { approachId: n.id, approachName: n.name, bearingDeg: 0, movement: 'T', label: '北T' },
      { approachId: s.id, approachName: s.name, bearingDeg: 180, movement: 'T', label: '南T' },
    )
    expect(cell.level).toBe('block')
  })

  it('builds square matrix', () => {
    const p = createCrossTemplate()
    const { keys, cells } = buildConflictMatrix(p.channelizationSchemes[0].approaches)
    expect(cells).toHaveLength(keys.length)
    expect(cells[0]).toHaveLength(keys.length)
  })
})

describe('advanced charts', () => {
  it('renders radar and los gauge', () => {
    const radar = radarChartSvg([
      { label: 'A', value: 0.4, max: 1 },
      { label: 'B', value: 0.7, max: 1 },
      { label: 'C', value: 0.2, max: 1 },
    ])
    expect(radar).toContain('雷达')
    const g = losGaugeSvg('D', 42)
    expect(g).toContain('服务水平')
    const m = conflictMatrixSvg(['N', 'E'], [
      ['same', 'ok'],
      ['ok', 'same'],
    ])
    expect(m).toContain('冲突矩阵')
  })
})
