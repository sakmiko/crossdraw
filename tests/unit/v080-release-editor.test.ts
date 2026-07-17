import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, buildSignalTimingAlignment } from '@/domain'
import { roadgeeSignalBoardSvg } from '@/ui/charts/roadgeeSignalBoard'

describe('v0.5.80 phase release editor', () => {
  it('PhaseReleaseEditor module has U/L/T/R and ped chips', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/layout/PhaseReleaseEditor.tsx'), 'utf8')
    expect(t).toContain('export function PhaseReleaseEditor')
    expect(t).toContain("'U'")
    expect(t).toContain("'L'")
    expect(t).toContain('onTogglePedestrian')
    expect(t).toContain('release-chip')
  })

  it('SignalWorkspace wires PhaseReleaseEditor', () => {
    const t = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(t).toContain('PhaseReleaseEditor')
    expect(t).toContain('includeU')
  })

  it('toggling release changes center board homology', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const sg = ch.flowSchemes[0].signalSchemes[0]
    const ph = sg.phases[0]
    const ap = ch.approaches[0]
    // clear then set only L
    ph.releases[ap.id] = ['L']
    const b1 = roadgeeSignalBoardSvg(ch.approaches, sg)
    expect(b1).toContain('#16a34a')
    ph.releases[ap.id] = ['L', 'T', 'R']
    const b2 = roadgeeSignalBoardSvg(ch.approaches, sg)
    expect(b2).not.toEqual(b1)
    const al = buildSignalTimingAlignment(sg)
    expect(al.cycleSec).toBe(sg.cycleSec)
  })
})

describe('v0.5.80 layout shell', () => {
  it('App uses SchemeSwitcher and ModeSideRail, signal stack', () => {
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('SchemeSwitcher')
    expect(app).toContain('page-fill')
    expect(app).toContain('page-fill-params')
    expect(app).toContain('page-fill-stage')
    expect(app).not.toContain('scheme-tree')
  })
})
