import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import {
  professionalPhaseNumberBoardSvg,
  phaseNumberBoardMarkdown,
} from '@/ui/charts/professionalPhaseNumberBoard'
import {
  collectRightTurnRows,
  professionalRightTurnBoardSvg,
  rightTurnBoardMarkdown,
  rightTurnBoardCsv,
} from '@/domain/channel/rightTurnReview'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.101 phase number + right-turn review', () => {
  it('phase number board single-ring', () => {
    const p = createCrossTemplate()
    const fl = p.channelizationSchemes[0].flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const svg = professionalPhaseNumberBoardSvg(sg, p.channelizationSchemes[0].approaches, {
      width: 900,
      projectName: p.name,
    })
    expect(svg).toContain('相位序号图')
    expect(svg).toContain('主相位')
    expect(svg).not.toContain('试用版')
    expect(phaseNumberBoardMarkdown(p.name, sg)).toContain('相位序号')
  })

  it('right-turn review from channel', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    // enable one right turn for non-empty notes path
    ch.approaches[0].rightTurn.enabled = true
    ch.approaches[0].rightTurn.radiusM = 12
    const rows = collectRightTurnRows(ch)
    expect(rows.length).toBe(ch.approaches.length)
    const svg = professionalRightTurnBoardSvg(ch, { projectName: p.name })
    expect(svg).toContain('右转渠化')
    expect(svg).toContain('安全岛')
    expect(rightTurnBoardMarkdown(p.name, ch)).toContain('右转')
    expect(rightTurnBoardCsv(ch)).toContain('radiusM')
  })

  it('export + UI wired flat', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('phase-number-board-svg')
    expect(ids).toContain('right-turn-review-svg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('导出相位序号')
    expect(sw).not.toMatch(/<details\b/)
    const cw = readFileSync(resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(cw).toContain('右转审查图')
    expect(cw).not.toMatch(/<details\b/)
  })
})
