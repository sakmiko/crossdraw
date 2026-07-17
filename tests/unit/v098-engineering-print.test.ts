import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection, rebuildChannelMesh } from '@/domain'
import {
  collectEngineeringPrintPanels,
  engineeringPrintManifest,
} from '@/io/engineeringPrintPack'
import { buildA4PrintSheet } from '@/io/printSheet'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.98 engineering A4 pack', () => {
  it('includes channel draft as first panel', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const analysis = analyzeIntersection(ch.approaches, fl, sg)
    const mesh = rebuildChannelMesh(ch)
    const panels = collectEngineeringPrintPanels({
      project: p,
      channel: ch,
      flow: fl,
      signal: sg,
      analysis,
      mesh,
      preferChannelDraft: true,
      preset: 'engineering',
    })
    expect(panels.length).toBeGreaterThanOrEqual(3)
    expect(panels[0].id).toBe('draft')
    expect(panels[0].title).toContain('渠化')
    expect(panels.map((x) => x.id)).toEqual(
      expect.arrayContaining(['draft', 'flow', 'timing']),
    )
    const sheet = buildA4PrintSheet(panels, {
      projectName: p.name,
      schemeName: ch.name,
      paper: 'A4-landscape',
    })
    expect(sheet).toContain('viewBox')
    expect(sheet).toMatch(/A4/)
    expect(engineeringPrintManifest(p.name, panels)).toContain('工程拼版清单')
  })

  it('export + UI wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('engineering-print-a4')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('A4 工程拼版')
    const cw = readFileSync(resolve(__dirname, '../../src/ui/layout/ChannelWorkspace.tsx'), 'utf8')
    expect(cw).not.toContain('A4 工程拼版') // removed from channel params v0.5.132
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('collectEngineeringPrintPanels')
    expect(app).toContain('engineering-print-a4')
  })
})
