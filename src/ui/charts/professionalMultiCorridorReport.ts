/**
 * Multi-corridor green-band professional report pack.
 * Homology: measureCorridor + computeCoordinationIndex + collectCorridorKpis.
 * Textbook light canvas, no watermark. Not GIS / not MAXBAND-MIP.
 */
import type { BandCorridor } from '@/domain/types'
import { computeCoordinationIndex } from '@/domain/analysis/coordinationIndex'
import {
  collectCorridorKpis,
  corridorKpiCompareSvg,
  multiBandMarkdown,
  type CorridorKpiRow,
} from '@/ui/charts/bandCorridorCompare'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function gradeColor(g: string): string {
  if (g === 'A' || g === 'B') return '#16a34a'
  if (g === 'C') return '#ca8a04'
  if (g === 'D') return '#ea580c'
  return '#dc2626'
}

export type CorridorReportRow = CorridorKpiRow & {
  coordScore: number
  coordGrade: string
  twoWayBalance: number
}

export function collectCorridorReportRows(corridors: BandCorridor[]): CorridorReportRow[] {
  return collectCorridorKpis(corridors).map((r) => {
    const ci = computeCoordinationIndex(r.result ? corridors.find((c) => c.id === r.id)! : corridors[0], r.result)
    // recompute with correct corridor
    const c = corridors.find((x) => x.id === r.id)
    const idx = c ? computeCoordinationIndex(c, r.result) : ci
    return {
      ...r,
      coordScore: idx.score,
      coordGrade: idx.grade,
      twoWayBalance: idx.twoWayBalance,
    }
  })
}

/** Hi-res multi-corridor pack: bar chart + coordination table. */
export function professionalMultiCorridorReportSvg(
  corridors: BandCorridor[],
  opts: { width?: number; projectName?: string } = {},
): string {
  const W = opts.width ?? 1000
  const rows = collectCorridorReportRows(corridors)
  const barSvg = corridorKpiCompareSvg(rows, { width: W - 40, height: 240, metric: 'both' })
  // recolor dark chart for light report
  const barInner = barSvg
    .replace(/<\/?svg[^>]*>/g, '')
    .replace(/#0a1020/g, '#ffffff')
    .replace(/#e2e8f0/g, '#0f172a')
    .replace(/#94a3b8/g, '#475569')
    .replace(/#8494ab/g, '#334155')
    .replace(/#64748b/g, '#64748b')

  const tableTop = 300
  const rowH = 28
  const H = tableTop + 40 + Math.max(1, rows.length) * rowH + 48

  let g = ''
  g += `<rect width="${W}" height="${H}" fill="#f8fafc"/>`
  g += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="#fff" stroke="#e2e8f0"/>`
  g += `<text x="28" y="36" fill="#0f172a" font-size="16" font-weight="700" font-family="system-ui,sans-serif">多走廊绿波报告</text>`
  g += `<text x="28" y="54" fill="#64748b" font-size="11">${esc(opts.projectName ?? '')} · ${rows.length} 条走廊 · measureCorridor 同源</text>`

  // summary KPI
  const best = rows.slice().sort((a, b) => b.bandwidthRatio - a.bandwidthRatio)[0]
  const avgRatio = rows.length ? rows.reduce((s, r) => s + r.bandwidthRatio, 0) / rows.length : 0
  const avgScore = rows.length ? rows.reduce((s, r) => s + r.coordScore, 0) / rows.length : 0
  const kpis: [string, string][] = [
    ['走廊数', String(rows.length)],
    ['均带宽比', `${(avgRatio * 100).toFixed(1)}%`],
    ['均协调分', avgScore.toFixed(0)],
    ['最优', best ? `${best.name} ${(best.bandwidthRatio * 100).toFixed(0)}%` : '—'],
  ]
  kpis.forEach((k, i) => {
    const x = W - 360 + i * 88
    g += `<rect x="${x}" y="20" width="82" height="36" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>`
    g += `<text x="${x + 6}" y="36" fill="#64748b" font-size="9">${k[0]}</text>`
    g += `<text x="${x + 6}" y="50" fill="#0f172a" font-size="11" font-weight="700">${esc(k[1])}</text>`
  })

  g += `<g transform="translate(20,70)">${barInner}</g>`

  // table header
  const xs = [28, 160, 230, 300, 380, 460, 540, 640, 740, 840]
  const heads = ['走廊', '方法', '节点', '长度m', '速度', '上行b', '下行b', '带宽比', '协调分', '等级']
  heads.forEach((h, i) => {
    g += `<text x="${xs[i]}" y="${tableTop}" fill="#64748b" font-size="11" font-weight="600">${h}</text>`
  })
  g += `<line x1="24" y1="${tableTop + 6}" x2="${W - 24}" y2="${tableTop + 6}" stroke="#e2e8f0"/>`

  if (!rows.length) {
    g += `<text x="28" y="${tableTop + 40}" fill="#94a3b8" font-size="12">无走廊</text>`
  }

  rows.forEach((r, i) => {
    const y = tableTop + 28 + i * rowH
    const bg = i % 2 === 0 ? '#f8fafc' : '#fff'
    g += `<rect x="16" y="${y - 14}" width="${W - 32}" height="${rowH}" fill="${bg}"/>`
    const vals = [
      r.name,
      r.method,
      String(r.nodes),
      r.lengthM.toFixed(0),
      String(r.speedKmh),
      r.forwardSec.toFixed(1),
      r.backwardSec.toFixed(1),
      `${(r.bandwidthRatio * 100).toFixed(1)}%`,
      r.coordScore.toFixed(0),
      r.coordGrade,
    ]
    vals.forEach((v, j) => {
      const fill = j === 9 ? gradeColor(r.coordGrade) : j === 8 ? gradeColor(r.coordGrade) : '#0f172a'
      g += `<text x="${xs[j]}" y="${y}" fill="${fill}" font-size="11" font-weight="${j === 0 || j === 9 ? 700 : 400}">${esc(v)}</text>`
    })
  })

  g += `<text x="28" y="${H - 16}" fill="#94a3b8" font-size="10">带宽弧相交度量 · 协调指数为工程合成 · 非 GIS / 非 MAXBAND-MIP</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="chart-svg chart-svg--pro">${g}</svg>`
}

export function multiCorridorReportMarkdown(
  projectName: string,
  corridors: BandCorridor[],
): string {
  const rows = collectCorridorReportRows(corridors)
  const base = multiBandMarkdown(projectName, rows)
  const extra = [
    '',
    '## 协调指数',
    '',
    '| 走廊 | 协调分 | 等级 | 上下行均衡 |',
    '|------|------:|:----:|----------:|',
    ...rows.map(
      (r) =>
        `| ${r.name} | ${r.coordScore.toFixed(1)} | ${r.coordGrade} | ${(r.twoWayBalance * 100).toFixed(0)}% |`,
    ),
    '',
    '- 协调分 = 0.7×带宽比×100 + 0.3×上下行均衡×100（工程合成，非国标）',
  ]
  return base + extra.join('\n')
}

export function multiCorridorReportCsv(corridors: BandCorridor[]): string {
  const rows = collectCorridorReportRows(corridors)
  const head =
    'name,method,nodes,lengthM,speedKmh,forwardSec,backwardSec,bandwidthRatio,coordScore,coordGrade,twoWayBalance'
  return [
    head,
    ...rows.map((r) =>
      [
        JSON.stringify(r.name),
        r.method,
        r.nodes,
        r.lengthM.toFixed(1),
        r.speedKmh,
        r.forwardSec.toFixed(2),
        r.backwardSec.toFixed(2),
        r.bandwidthRatio.toFixed(4),
        r.coordScore.toFixed(1),
        r.coordGrade,
        r.twoWayBalance.toFixed(4),
      ].join(','),
    ),
  ].join('\n')
}
