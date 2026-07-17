import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createFiveLegTemplate, createCrossTemplate } from '@/domain'
import { corridorNetworkPreviewSvg } from '@/ui/charts/corridorNetworkPreview'
import { measureCorridor } from '@/domain/analysis/corridor'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.88 corridor network + five-leg', () => {
  it('five-leg template has 5 approaches and phases', () => {
    const p = createFiveLegTemplate()
    const ch = p.channelizationSchemes[0]
    expect(ch.approaches).toHaveLength(5)
    expect(ch.approaches.map((a) => a.bearingDeg).sort((a, b) => a - b)).toEqual([0, 72, 144, 216, 288])
    const sg = ch.flowSchemes[0].signalSchemes[0]
    expect(sg.phases.length).toBe(5)
    expect(Object.keys(ch.flowSchemes[0].volumes)).toHaveLength(5)
  })

  it('high-res network preview from corridor + band result', () => {
    const p = createCrossTemplate()
    const band = measureCorridor(p.bandCorridor)
    const svg = corridorNetworkPreviewSvg(p.bandCorridor, band, { width: 1200, height: 440 })
    expect(svg).toContain('干道路网预览')
    expect(svg).toContain('1200')
    expect(svg).toContain('桩号')
    expect(svg).not.toContain('试用版')
    expect(svg.length).toBeGreaterThan(2000)
  })

  it('export catalog + BandPage + menu wired', () => {
    expect(EXPORT_CATALOG.map((x) => x.id)).toContain('corridor-network-svg')
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('corridorNetworkPreviewSvg')
    expect(bp).toContain('路网预览')
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toContain('五路')
    expect(app).toContain('corridor-network-svg')
  })
})
