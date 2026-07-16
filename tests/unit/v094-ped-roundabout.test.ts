import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, createTemplateByType } from '@/domain'
import { makePedestrianOnlyPhase } from '@/domain/signal/pedestrian'
import {
  professionalPedestrianBoardSvg,
  pedestrianTimingMarkdown,
  pedestrianTimingCsv,
} from '@/ui/charts/professionalPedestrianBoard'
import {
  professionalRoundaboutPlanSvg,
  roundaboutLayoutMarkdown,
} from '@/ui/charts/professionalRoundaboutPlan'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.94 ped board + roundabout plan', () => {
  it('pedestrian board with Walk/FDW', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    let sg = fl.signalSchemes[0]
    const ped = makePedestrianOnlyPhase('ped1', '行人A', ch.approaches.map((a) => a.id), 18)
    sg = { ...sg, phases: [...sg.phases, ped] }
    const svg = professionalPedestrianBoardSvg(ch.approaches, sg, {
      focusPhaseId: ped.id,
      projectName: p.name,
      width: 960,
    })
    expect(svg).toContain('行人过街审查看板')
    expect(svg).toContain('Walk')
    expect(svg).not.toContain('试用版')
    const md = pedestrianTimingMarkdown(p.name, ch.approaches, sg)
    expect(md).toContain('Walk')
    expect(pedestrianTimingCsv(ch.approaches, sg)).toContain('walk')
  })

  it('roundabout plan scales with approaches', () => {
    const p = createTemplateByType('roundabout')
    const ch = p.channelizationSchemes[0]
    const svg = professionalRoundaboutPlanSvg(ch.approaches, { size: 720, projectName: p.name })
    expect(svg).toContain('环形交叉口布局图')
    expect(svg).toContain('中心岛')
    expect(svg).toContain('内岛')
    expect(roundaboutLayoutMarkdown(p.name, ch.approaches)).toContain('环岛')
  })

  it('export + UI wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('ped-board-svg')
    expect(ids).toContain('roundabout-plan-svg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('行人审查看板')
    const cw = readFileSync(resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(cw).toContain('环岛布局图')
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('ped-board-svg')
    expect(app).toContain('roundabout-plan-svg')
  })
})
