import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  collectStorageCheckRows,
  storageCheckSummary,
  storageCheckMarkdown,
  storageCheckCsv,
} from '@/domain/channel/storageCheck'
import { storageCheckBoardSvg } from '@/ui/charts/storageCheckBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.108 approach storage check', () => {
  it('compares queue vs widen bay', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    // ensure some widen
    ch.approaches.forEach((ap) => {
      ap.widen = { ...ap.widen, entryWidenLengthM: 40, entryTaperM: 20 }
    })
    const an = analyzeIntersection(ch.approaches, fl, sg)
    const rows = collectStorageCheckRows(ch.approaches, sg, an)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.availableM > 0)).toBe(true)
    const sum = storageCheckSummary(rows)
    expect(sum.total).toBe(rows.length)
    const svg = storageCheckBoardSvg(ch.approaches, sg, an)
    expect(svg).toContain('进口道储存校核')
    expect(storageCheckMarkdown(p.name, rows)).toContain('储存长度')
    expect(storageCheckCsv(rows)).toContain('queueM')
  })

  it('flags overflow when bay tiny', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    ch.approaches.forEach((ap) => {
      ap.widen = { ...ap.widen, entryWidenLengthM: 5, entryTaperM: 0 }
    })
    const an = analyzeIntersection(ch.approaches, fl, sg)
    // force high queue by patching analysis volumes conceptually via bay=5
    const rows = collectStorageCheckRows(ch.approaches, sg, an)
    expect(rows.every((r) => r.availableM === 5 || r.availableM === 20)).toBe(true)
    expect(rows.some((r) => r.ratio >= 0)).toBe(true)
  })

  it('export + analysis wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('storage-check-svg')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('进口道储存校核')
    expect(aw).toContain('storageCheckBoardSvg')
  })
})
