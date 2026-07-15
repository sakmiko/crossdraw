import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import {
  buildFlowAlignment,
  flowChartsAlignWithTable,
} from '@/domain/flow/flowAlign'
import { convertVolumes } from '@/domain/flow/convert'

describe('flow alignment v0.5.18', () => {
  it('natural mode chart equals table L/T/R', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const check = flowChartsAlignWithTable(ch.approaches, fl, 'natural')
    expect(check.ok).toBe(true)
    const al = buildFlowAlignment(ch.approaches, fl, 'natural')
    for (const r of al.rows) {
      const v = fl.volumes[r.approachId]
      expect(r.chartL).toBe(v.L)
      expect(r.chartT).toBe(v.T)
      expect(r.chartR).toBe(v.R)
    }
    expect(al.diagramData.length).toBe(ch.approaches.length)
    expect(al.barGroups[0].items.map((i) => i.key)).toEqual(['L', 'T', 'R'])
  })

  it('peak mode matches convertVolumes', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    fl.heavyRatio = 0.2
    fl.phf = 0.9
    const check = flowChartsAlignWithTable(ch.approaches, fl, 'peak')
    expect(check.ok).toBe(true)
    const al = buildFlowAlignment(ch.approaches, fl, 'peak')
    const peaks = convertVolumes(
      fl,
      ch.approaches.map((a) => a.id),
    )
    for (const r of al.rows) {
      const peak = peaks.find((x) => x.approachId === r.approachId)!.peak
      expect(r.chartL).toBeCloseTo(peak.L, 8)
      expect(r.chartT).toBeCloseTo(peak.T, 8)
      expect(r.chartR).toBeCloseTo(peak.R, 8)
    }
  })

  it('diagramData totals equal row chart sums', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const al = buildFlowAlignment(ch.approaches, fl, 'natural')
    const sumDiag = al.diagramData.reduce((s, d) => s + d.L + d.T + d.R, 0)
    const sumRows = al.rows.reduce((s, r) => s + r.chartL + r.chartT + r.chartR, 0)
    expect(sumDiag).toBe(sumRows)
    expect(sumRows).toBe(al.totalLTR)
  })
})
