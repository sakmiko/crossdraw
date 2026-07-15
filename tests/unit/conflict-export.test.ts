import { describe, expect, it } from 'vitest'
import { createCrossTemplate } from '@/domain'
import { conflictHitsMarkdown, conflictMatrixExportSvg } from '@/ui/charts/conflictExport'

describe('conflict export v0.5.31', () => {
  it('exports matrix svg with title', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const svg = conflictMatrixExportSvg(ch.approaches, sg, sg.phases[0].id)
    expect(svg).toContain('转向冲突矩阵')
    expect(svg).toContain(sg.name)
  })

  it('markdown lists phases', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const md = conflictHitsMarkdown(p.name, ch.approaches, sg)
    expect(md).toContain('信号冲突审查')
    expect(md).toContain(sg.phases[0].name)
  })
})
