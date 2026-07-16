import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCrossTemplate, analyzeIntersection } from '@/domain'
import {
  criticalYBoardSvg,
  criticalYMarkdown,
  criticalYCsv,
  collectYReport,
} from '@/ui/charts/criticalYBoard'
import {
  collectQueueStorageRows,
  queueStorageBoardSvg,
  queueStorageCsv,
} from '@/ui/charts/queueStorageBoard'
import { EXPORT_CATALOG } from '@/io/exportCatalog'

describe('v0.5.105 Y board + queue storage + UI', () => {
  it('builds critical Y board', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const y = collectYReport(ch.approaches, fl, sg)
    expect(y.Y).toBeGreaterThan(0)
    const svg = criticalYBoardSvg(ch.approaches, fl, sg)
    expect(svg).toContain('Y=')
    expect(svg).not.toMatch(/试用版|watermark/i)
    expect(criticalYMarkdown(p.name, ch.approaches, fl, sg)).toContain('关键流量比')
    expect(criticalYCsv(ch.approaches, fl, sg)).toContain('phase,y')
  })

  it('queue storage rows from analysis', () => {
    const p = createCrossTemplate()
    const ch = p.channelizationSchemes[0]
    const fl = ch.flowSchemes[0]
    const sg = fl.signalSchemes[0]
    const an = analyzeIntersection(ch.approaches, fl, sg)
    const rows = collectQueueStorageRows(ch.approaches, sg, an)
    expect(rows.length).toBeGreaterThan(0)
    expect(queueStorageBoardSvg(rows)).toContain('排队储存')
    expect(queueStorageCsv(rows)).toContain('storageM')
  })

  it('export + workspaces wired', () => {
    const ids = EXPORT_CATALOG.map((x) => x.id)
    expect(ids).toContain('critical-y-board-svg')
    expect(ids).toContain('queue-storage-svg')
    const sw = readFileSync(resolve(__dirname, '../../src/ui/layout/SignalWorkspace.tsx'), 'utf8')
    expect(sw).toContain('一键全方案')
    expect(sw).toContain('Y分解图')
    const aw = readFileSync(resolve(__dirname, '../../src/ui/layout/AnalysisWorkspace.tsx'), 'utf8')
    expect(aw).toContain('一键全方案优化')
    expect(aw).toContain('排队储存审查')
    expect(aw).toContain('评价净图')
    const survey = readFileSync(
      resolve(__dirname, '../../docs/research/07-online-methods-supplement-20260716.md'),
      'utf8',
    )
    expect(survey).toContain('Webster')
  })
})
