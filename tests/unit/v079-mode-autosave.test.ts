import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import { roadgeeFlowDiagramSvg } from '@/ui/charts/roadgeeFlowDiagram'
import { roadgeeSignalBoardSvg } from '@/ui/charts/roadgeeSignalBoard'
import { roadgeeAnalysisPlanSvg } from '@/ui/charts/roadgeeAnalysisPlan'

describe('v0.5.79 silent autosave + mode stages', () => {
  it('App uses silent dirty debounce autosave and ModeCenterStage', () => {
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('ModeCenterStage')
    expect(app).toContain('persistAutosave')
    expect(app).toContain('setTimeout')
    expect(app).not.toContain('save-pill')
    expect(app).not.toContain('未保存')
    expect(app).not.toContain('发现自动保存')
  })

  it('diagrams recompute when volumes / greens change', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    for (const ap of ch.approaches) fl.volumes[ap.id] = { U: 0, L: 100, T: 100, R: 100 }
    const svg1 = roadgeeFlowDiagramSvg(ch.approaches, fl, { mode: 'natural' })
    expect(svg1).toContain('300')
    fl.volumes[ch.approaches[0].id] = { U: 0, L: 200, T: 200, R: 200 }
    const svg2 = roadgeeFlowDiagramSvg(ch.approaches, fl, { mode: 'natural' })
    expect(svg2).toContain('600')
    expect(svg1).not.toEqual(svg2)

    const g0 = sg.phases[0].greenSec
    const board1 = roadgeeSignalBoardSvg(ch.approaches, sg)
    sg.phases[0].greenSec = g0 + 5
    const board2 = roadgeeSignalBoardSvg(ch.approaches, sg)
    expect(board2).toContain(String(g0 + 5))
    expect(board1).not.toEqual(board2)

    const a1 = analyzeIntersection(ch.approaches, fl, sg)
    const plan = roadgeeAnalysisPlanSvg(ch.approaches, a1, { metric: 'los' })
    expect(plan).toContain(a1.losFinal)
    expect(plan).not.toMatch(/试用版|不可商用/)
  })

  it('ModeCenterStage module exists', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/layout/ModeCenterStage.tsx'), 'utf8')
    expect(t).toContain('export function ModeCenterStage')
    expect(t).toContain("mode === 'flow'")
    expect(t).toContain("mode === 'signal'")
    expect(t).toContain("mode === 'analysis'")
  })
})
