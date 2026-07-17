import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, enableDualRing } from '@/domain'
import {
  professionalDualRingBoardSvg,
  dualRingBoardMarkdown,
  dualRingBoardCsv,
} from '@/ui/charts/professionalDualRingBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.96 dual-ring board', () => {
  it('builds board when dual-ring enabled', () => {
    const p = createCrossTemplate()
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    const sg = enableDualRing(fl.signalSchemes[0], true)
    const svg = professionalDualRingBoardSvg(sg, { width: 960, projectName: p.name })
    expect(svg).toContain('双环栏审查看板')
    expect(svg).toContain('屏障阶段明细')
    expect(svg).not.toContain('试用版')
    expect(svg.length).toBeGreaterThan(1500)
    expect(dualRingBoardMarkdown(p.name, sg)).toContain('双环')
    expect(dualRingBoardCsv(sg)).toContain('barrier')
  })

  it('export + flat signal UI wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('dual-ring-board-svg')
    expect(ids).toContain('dual-ring-board-md')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('环栏')
    expect(sw).toContain('professionalDualRingBoardSvg')
    expect(sw).not.toMatch(/<details\b/)
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('dual-ring-board-svg')
  })
})
