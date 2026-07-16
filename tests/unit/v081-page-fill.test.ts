import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate } from '@/domain'
import { useAppStore } from '@/state/store'
import { roadgeeFlowDiagramSvg, DEFAULT_ROADGEE_FLOW_STYLE } from '@/ui/charts/roadgeeFlowDiagram'

describe('v0.5.81 full-page layout + flow form', () => {
  it('App uses page-fill without ModeSideRail / scheme-tree / right aside', () => {
    const app = readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8')
    expect(app).toContain('page-fill')
    expect(app).toContain('page-fill-stage')
    expect(app).toContain('page-fill-params')
    expect(app).toContain('SchemeSwitcher')
    expect(app).not.toContain('ModeSideRail')
    expect(app).not.toContain('scheme-tree')
    expect(app).not.toMatch(/<aside className=\{`right/)
    expect(app).toContain('approach-strip')
  })

  it('CSS main grid is nav + fill only', () => {
    const css = readFileSync(resolve(__dirname, '../../src/ui/styles.css'), 'utf8')
    expect(css).toContain('grid-template-columns: var(--shell-nav) minmax(0, 1fr)')
    expect(css).toContain('.page-fill-body')
  })

  it('FlowWorkspace has RoadGee sections and setLaneSatFlow works', () => {
    const fw = readFileSync(resolve(__dirname, '../../src/ui/layout/FlowWorkspace.tsx'), 'utf8')
    for (const s of ['绘图属性', '车道属性', '进口道转向流量', '饱和流率']) {
      expect(fw).toContain(s)
    }
    const p = createCrossTemplate()
    useAppStore.getState().loadProject(p)
    const ap = p.channelizationSchemes[0].approaches[0]
    useAppStore.getState().setLaneSatFlow(ap.id, 0, 1800)
    const ch = useAppStore.getState().project.channelizationSchemes.find(
      (c) => c.id === useAppStore.getState().project.active.channelId,
    )
    expect(ch?.approaches.find((a) => a.id === ap.id)?.entryLanes[0].satFlowPcu).toBe(1800)

    const fl = ch!.flowSchemes[0]
    const svg1 = roadgeeFlowDiagramSvg(ch!.approaches, fl, {
      style: { ...DEFAULT_ROADGEE_FLOW_STYLE, scheme: 1 },
    })
    const svg2 = roadgeeFlowDiagramSvg(ch!.approaches, fl, {
      style: { ...DEFAULT_ROADGEE_FLOW_STYLE, scheme: 2 },
    })
    expect(svg1).not.toEqual(svg2)
  })
})
