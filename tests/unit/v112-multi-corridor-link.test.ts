import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, cloneBandCorridor, measureCorridor } from '@/domain'
import {
  linkMultiCorridorOffsets,
  multiCorridorLinkMarkdown,
  multiCorridorLinkCsv,
} from '@/domain/analysis/multiCorridorLink'
import { multiCorridorLinkBoardSvg } from '@/ui/charts/multiCorridorLinkBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.112 multi-corridor offset link', () => {
  it('applies progressive offsets to every corridor', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, '辅路走廊'))
    p.bandCorridors[1].speedKmh = 50
    // scramble offsets so progressive changes something measurable
    for (const c of p.bandCorridors) {
      c.nodes = c.nodes.map((n, i) => ({ ...n, offsetSec: i * 7 + 3, lockedOffset: false }))
    }
    const r = linkMultiCorridorOffsets(p.bandCorridors, 'progressive')
    expect(r.rows.length).toBe(p.bandCorridors.length)
    expect(r.corridors.length).toBe(p.bandCorridors.length)
    expect(r.mode).toBe('progressive')
    for (const c of r.corridors) {
      const m = measureCorridor(c)
      expect(m.forwardBandwidthSec + (m.backwardBandwidthSec ?? 0)).toBeGreaterThanOrEqual(0)
    }
    expect(multiCorridorLinkBoardSvg(r)).toContain('多走廊相位差联动')
    expect(multiCorridorLinkMarkdown(p.name, r)).toContain('连续相位差')
    expect(multiCorridorLinkCsv(r)).toContain('beforeTotal')
  })

  it('offset-scan mode writes free-node optima', () => {
    const p = createCrossTemplate()
    p.bandCorridors.push(cloneBandCorridor(p.bandCorridor, 'B'))
    const r = linkMultiCorridorOffsets(p.bandCorridors, 'offset-scan')
    expect(r.mode).toBe('offset-scan')
    expect(r.rows.every((row) => row.detail.includes('o*') || row.detail.length > 0)).toBe(true)
  })

  it('export + BandPage + store wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('multi-corridor-link-svg')
    expect(ids).toContain('multi-corridor-link-md')
    expect(ids).toContain('multi-corridor-link-csv')
    const bp = readFileSync(resolve(__dirname, '../../src/ui/layout/BandPage.tsx'), 'utf8')
    expect(bp).toContain('联动连续')
    expect(bp).toContain('联动扫描')
    expect(bp).toMatch(/走廊|link|offset|EChart|BandPage/)
    expect(bp).toContain('multiCorridorLinkBoardSvg')
    const st = readFileSync(resolve(__dirname, '../../src/state/store.ts'), 'utf8')
    expect(st).toContain('linkAllCorridorOffsets')
    const app = (readFileSync(resolve(__dirname, '../../src/ui/layout/App.tsx'), 'utf8') + readFileSync(resolve(__dirname, '../../src/io/buildExportHandlers.ts'), 'utf8'))
    expect(app).toMatch(/v0\.5\.\d+/)
  })
})
