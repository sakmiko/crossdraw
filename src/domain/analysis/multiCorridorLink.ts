/**
 * Multi-corridor offset / progressive linkage.
 * Apply the same engineering transform to every corridor, measure before/after.
 * Homology: progressiveOffset / offsetScan / measureCorridor. Not joint MIP.
 */
import type { BandCorridor } from '../types'
import { measureCorridor } from './corridor'
import { applyProgressiveOffsets } from './progressiveOffset'
import { scanCorridorOffsets, applyOffsetScanBest } from './offsetScan'

export type MultiCorridorLinkMode = 'progressive' | 'progressive-reverse' | 'offset-scan'

export type MultiCorridorLinkRow = {
  id: string
  name: string
  beforeTotal: number
  afterTotal: number
  beforeRatio: number
  afterRatio: number
  improved: boolean
  detail: string
}

export type MultiCorridorLinkResult = {
  mode: MultiCorridorLinkMode
  corridors: BandCorridor[]
  rows: MultiCorridorLinkRow[]
  improvedCount: number
  honesty: string
}

function totalBand(c: BandCorridor): { total: number; ratio: number } {
  const m = measureCorridor(c)
  const total = (m.forwardBandwidthSec ?? 0) + (m.backwardBandwidthSec ?? 0)
  return { total, ratio: m.bandwidthRatio }
}

export function linkMultiCorridorOffsets(
  corridors: BandCorridor[],
  mode: MultiCorridorLinkMode = 'progressive',
): MultiCorridorLinkResult {
  const rows: MultiCorridorLinkRow[] = []
  const out: BandCorridor[] = []

  for (const c of corridors) {
    const before = totalBand(c)
    let next: BandCorridor
    let detail: string
    if (mode === 'offset-scan') {
      const scan = scanCorridorOffsets(c, { stepSec: 2 })
      next = applyOffsetScanBest(c, scan)
      detail = `o*→${scan.bestDeltaSec.toFixed(0)}s · ${scan.freeNodeName}`
    } else {
      const reverse = mode === 'progressive-reverse'
      next = applyProgressiveOffsets(c, reverse)
      detail = reverse ? '反向连续相位差' : '连续相位差'
    }
    const after = totalBand(next)
    rows.push({
      id: c.id,
      name: c.name,
      beforeTotal: before.total,
      afterTotal: after.total,
      beforeRatio: before.ratio,
      afterRatio: after.ratio,
      improved: after.total + 1e-9 >= before.total,
      detail,
    })
    out.push(next)
  }

  return {
    mode,
    corridors: out,
    rows,
    improvedCount: rows.filter((r) => r.improved).length,
    honesty: '各走廊独立写相位差 · 非多走廊联合 MIP',
  }
}

export function multiCorridorLinkMarkdown(
  projectName: string,
  r: MultiCorridorLinkResult,
): string {
  const modeLabel =
    r.mode === 'offset-scan'
      ? '相位差扫描'
      : r.mode === 'progressive-reverse'
        ? '反向连续相位差'
        : '连续相位差'
  return [
    `# ${projectName} · 多走廊相位差联动`,
    '',
    `- 模式：**${modeLabel}** · 走廊 ${r.rows.length} · 未变差 ${r.improvedCount}`,
    '',
    '| 走廊 | 前Σb | 后Σb | 前比 | 后比 | 详情 |',
    '|------|-----:|-----:|-----:|-----:|------|',
    ...r.rows.map(
      (row) =>
        `| ${row.name} | ${row.beforeTotal.toFixed(1)} | ${row.afterTotal.toFixed(1)} | ${(row.beforeRatio * 100).toFixed(1)}% | ${(row.afterRatio * 100).toFixed(1)}% | ${row.detail} |`,
    ),
    '',
    `- ${r.honesty}`,
  ].join('\n')
}

export function multiCorridorLinkCsv(r: MultiCorridorLinkResult): string {
  return [
    'id,name,beforeTotal,afterTotal,beforeRatio,afterRatio,improved,detail',
    ...r.rows.map((row) =>
      [
        row.id,
        JSON.stringify(row.name),
        row.beforeTotal.toFixed(2),
        row.afterTotal.toFixed(2),
        row.beforeRatio.toFixed(4),
        row.afterRatio.toFixed(4),
        row.improved ? 1 : 0,
        JSON.stringify(row.detail),
      ].join(','),
    ),
  ].join('\n')
}
