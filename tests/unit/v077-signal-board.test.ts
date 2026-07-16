import { describe, expect, it } from 'vitest'
import { createCrossTemplate, buildSignalTimingAlignment } from '@/domain'
import { roadgeeSignalBoardSvg, roadgeePhaseFaceSvg } from '@/ui/charts/roadgeeSignalBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.77 roadgee signal board', () => {
  it('phase face shows green releases and no watermark', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const ph = sg.phases[0]
    const face = roadgeePhaseFaceSvg(ch.approaches, ph, { size: 100 })
    expect(face).toContain('#16a34a')
    expect(face).not.toMatch(/试用版|不可商用/)
  })

  it('board uses cycle C and phase greens from scheme', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const al = buildSignalTimingAlignment(sg)
    const svg = roadgeeSignalBoardSvg(ch.approaches, sg, { width: 600 })
    expect(svg).toContain(`C=${al.cycleSec}`)
    expect(svg).toContain('第1相位')
    expect(svg).toContain(String(sg.phases[0].greenSec))
    expect(svg).not.toMatch(/试用版|不可商用|watermark/i)
  })

  it('export catalog has roadgee-signal-board', () => {
    expect(EXPORT_CATALOG.some((x) => x.id === 'roadgee-signal-board')).toBe(true)
  })
})
