import { describe, expect, it } from 'vitest'
import { buildA4PrintSheet, parseSvgFragment } from '@/io/printSheet'
import { signalTimingDiagramSvg } from '@/ui/charts/professionalDiagrams'

describe('print sheet v0.5.24', () => {
  it('parses svg fragment viewBox', () => {
    const f = parseSvgFragment('<svg viewBox="0 0 100 50"><rect width="10" height="10"/></svg>')
    expect(f.vb[2]).toBe(100)
    expect(f.vb[3]).toBe(50)
    expect(f.body).toContain('rect')
  })

  it('builds A4 sheet with panels', () => {
    const timing = signalTimingDiagramSvg(
      [
        { name: 'φ1', greenSec: 30, yellowSec: 3, allRedSec: 2 },
        { name: 'φ2', greenSec: 30, yellowSec: 3, allRedSec: 2 },
      ],
      70,
    )
    const sheet = buildA4PrintSheet(
      [
        { id: 't', title: '配时', svg: timing },
        { id: 't2', title: '配时2', svg: timing },
      ],
      { projectName: 'Demo', schemeName: '方案A', paper: 'A4' },
    )
    expect(sheet).toContain('viewBox="0 0 210 297"')
    expect(sheet).toContain('Demo')
    expect(sheet).toContain('配时')
    expect(sheet).toContain('A4 纵向')
  })

  it('landscape paper size', () => {
    const timing = signalTimingDiagramSvg(
      [{ name: 'φ1', greenSec: 40, yellowSec: 3, allRedSec: 2 }],
      90,
    )
    const sheet = buildA4PrintSheet([{ id: 't', title: 'T', svg: timing }], {
      projectName: 'P',
      schemeName: 'S',
      paper: 'A4-landscape',
    })
    expect(sheet).toContain('viewBox="0 0 297 210"')
  })
})
