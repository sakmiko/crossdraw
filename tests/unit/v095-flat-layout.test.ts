import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, createTemplateByType } from '@/domain'
import { makePedestrianOnlyPhase } from '@/domain/signal/pedestrian'
import {
  professionalPedestrianBoardSvg,
  pedestrianTimingMarkdown,
} from '@/ui/charts/professionalPedestrianBoard'
import { professionalRoundaboutPlanSvg } from '@/ui/charts/professionalRoundaboutPlan'

describe('v0.5.95 flat layout + ped/roundabout', () => {
  it('workspaces are flat (no details subpanels)', () => {
    for (const name of [
      'SignalWorkspace.tsx',
      'FlowWorkspace.tsx',
      'ChannelWorkspace.tsx',
      'AnalysisWorkspace.tsx',
      'CompareWorkspace.tsx',
      'XSectionWorkspace.tsx',
    ]) {
      const t = readFileSync(resolve(__dirname, `../../src/ui/layout/${name}`), 'utf8')
      expect(t).not.toMatch(/<details\b/)
      expect(t).toMatch(/flat-params|flat-block|flat-section|rg-section/)
    }
    const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')
    expect(css).toContain('v0.5.95 flat workspaces')
  })

  it('ped board and roundabout plan still work', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const ped = makePedestrianOnlyPhase(
      'ped1',
      '行人A',
      ch.approaches.map((a) => a.id),
      18,
    )
    const sg = { ...ch.flowSchemes[0].signalSchemes[0], phases: [...ch.flowSchemes[0].signalSchemes[0].phases, ped] }
    const svg = professionalPedestrianBoardSvg(ch.approaches, sg, { focusPhaseId: ped.id, width: 900 })
    expect(svg).toContain('行人过街审查看板')
    expect(pedestrianTimingMarkdown(p.name, ch.approaches, sg)).toContain('Walk')

    const ra = createTemplateByType('roundabout')
    const rsvg = professionalRoundaboutPlanSvg(ra.channelizationSchemes[0].approaches, { size: 640 })
    expect(rsvg).toContain('环形交叉口布局图')
  })

  it('UI wires ped board button', () => {
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('行人审查看板')
  })
})
