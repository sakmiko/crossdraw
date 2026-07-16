import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { buildVissimInpxPack } from '@/io/vissimInpx'
import {
  professionalConflictBoardSvg,
  conflictBoardCsv,
} from '@/ui/charts/professionalConflictBoard'
import { vissimPackSummaryMarkdown } from '@/io/vissimPackDownload'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.93 conflict board + vissim pack', () => {
  it('builds professional conflict board', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const svg = professionalConflictBoardSvg(ch.approaches, sg, {
      phaseId: sg.phases[0]?.id,
      projectName: p.name,
      width: 1000,
    })
    expect(svg).toContain('相位冲突审查看板')
    expect(svg).toContain('转向冲突矩阵')
    expect(svg).not.toContain('试用版')
    expect(svg.length).toBeGreaterThan(2000)
    const csv = conflictBoardCsv(ch.approaches, sg)
    expect(csv).toContain('phase')
  })

  it('vissim pack is open interchange not proprietary binary', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const pack = buildVissimInpxPack(p.name, ch.approaches, fl, sg)
    expect(pack.xml).toContain('<?xml')
    expect(pack.readme.length).toBeGreaterThan(40)
    expect(pack.bundle.links).toContain(',')
    const md = vissimPackSummaryMarkdown(p.name, ch.approaches, fl, sg)
    expect(md).toContain('非 PTV')
  })

  it('export + UI wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('conflict-board-svg')
    expect(ids).toContain('vissim-pack-oneclick')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('冲突审查看板')
    expect(sw).toContain('professionalConflictBoardSvg')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('一键 VISSIM')
    expect(aw).toContain('downloadVissimPack')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('conflict-board-svg')
    expect(app).toContain('vissim-pack-oneclick')
  })
})
